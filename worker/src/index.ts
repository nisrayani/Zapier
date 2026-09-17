import { PrismaClient } from "@prisma/client";
import type { JsonObject } from "@prisma/client/runtime/library";
import { Kafka } from "kafkajs";
import { parse } from "./parser.js";
import { sendEmail } from "./email.js";
import { sendSol } from "./solana.js";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});
const KAFKA_TOPIC = "zap-events";

async function main() {
  const consumer = kafka.consumer({ groupId: "main-worker-2" });
  await consumer.connect();
  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
  console.log(
    `Connected to Kafka broker from worker and ready to consume from topic ${KAFKA_TOPIC}`,
  );

  const producer = kafka.producer();
  await producer.connect();
  console.log(
    `Connected to Kafka broker from worker and ready to publish to topic ${KAFKA_TOPIC}`,
  );

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log(
        `Received event from topic ${topic}:`,
        message.value?.toString(),
      );

      if (!message.value?.toString()) {
        return;
      }

      try {
        JSON.parse(message.value?.toString());
      } catch (err) {
        console.log("Error parsing the value");
        return;
      }

      const parsedValue = JSON.parse(message.value?.toString());
      const zapRunId = parsedValue.zapRunId;
      const stage = parsedValue.stage;

      const zapRunDetails = await prisma.zapRun.findFirst({
        where: {
          id: zapRunId,
        },
        include: {
          zap: {
            include: {
              trigger: true,
              actions: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });

      const actions = zapRunDetails?.zap.actions;
      const currentAction = actions?.find(
        (action) => action.sortingOrder == stage,
      );

      if (!currentAction) {
        console.log(`No action exist at stage : ${stage}`);
        await consumer.commitOffsets([
          {
            topic: KAFKA_TOPIC,
            partition: partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ]);
        return;
      }

      if (stage === 0) {
        await prisma.zapRun.update({
          where: { id: zapRunId },
          data: {
            status: "RUNNING",
          },
        });
      }

      try {
        const zapRunDetailsMetaData = zapRunDetails?.metadata;

        switch (currentAction.type.name) {
          case "email":
            console.log("Processing Email action");
            const body = parse(
              (currentAction.metadata as JsonObject).body as string,
              zapRunDetailsMetaData as Record<string, any>,
            );
            const to = parse(
              (currentAction.metadata as JsonObject).email as string,
              zapRunDetailsMetaData as Record<string, any>,
            );
            const subject = parse(
              ((currentAction.metadata as JsonObject).subject as string) ??
                "Hello from Zapier",
              zapRunDetailsMetaData as Record<string, any>,
            );

            await sendEmail(to, subject, body);
            break;
          case "solana_send":
            console.log("Processing Solana send");
            const amount = parse(
              (currentAction.metadata as JsonObject).amount as string,
              zapRunDetailsMetaData as Record<string, any>,
            );
            const address = parse(
              (currentAction.metadata as JsonObject).address as string,
              zapRunDetailsMetaData as Record<string, any>,
            );
            await sendSol(amount, address);
            break;
          default:
        }

        const lastStage = (actions?.length || 1) - 1;
        if (stage !== lastStage) {
          const nextStage = currentAction.sortingOrder + 1;

          await prisma.zapRun.update({
            where: { id: zapRunId },
            data: {
              status: "RUNNING",
            },
          });

          await producer.send({
            topic: KAFKA_TOPIC,
            messages: [
              {
                value: JSON.stringify({
                  zapRunId,
                  stage: nextStage,
                }),
              },
            ],
          });

          console.log(
            `Pushed above event ${parsedValue} with stage: ${nextStage} to Kafka`,
          );
        } else {
          await prisma.zapRun.update({
            where: { id: zapRunId },
            data: {
              status: "COMPLETED",
            },
          });
          console.log(`Processed last stage of ${parsedValue}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        console.log(
          `Processed event from topic ${topic}:`,
          message.value?.toString(),
        );

        await consumer.commitOffsets([
          {
            topic: KAFKA_TOPIC,
            partition: partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ]);
      } catch (error) {
        console.error(`Error at stage ${stage} for run ${zapRunId}:`, error);
        await prisma.zapRun
          .update({
            where: { id: zapRunId },
            data: {
              status: "FAILED",
            },
          })
          .catch(() => undefined);
      }
    },
  });
}

main();
