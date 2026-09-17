import { PrismaClient } from "@prisma/client";
import type { JsonObject } from "@prisma/client/runtime/library";
import { Kafka } from "kafkajs";
import { GoogleGenAI } from "@google/genai";
import { parse } from "./parser.js";
import { sendEmail } from "./email.js";
import { sendSol } from "./solana.js";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn(
    "GEMINI_API_KEY is not configured. AI actions will fail until it is set.",
  );
}

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
const KAFKA_TOPIC = "zap-events";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function requeueFailedMessage(
  producer: ReturnType<typeof kafka.producer>,
  topic: string,
  payload: Record<string, any>,
  nextAttempt: number,
  error: unknown,
) {
  const retryPayload = {
    ...payload,
    attempt: nextAttempt,
    lastError: error instanceof Error ? error.message : String(error),
    retryAt: Date.now() + RETRY_DELAY_MS,
  };

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(retryPayload) }],
  });

  console.warn(
    `Retry scheduled for zapRunId=${payload.zapRunId}, stage=${payload.stage}, attempt=${nextAttempt}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms`,
  );
}

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
      const attempt = Number(parsedValue.attempt ?? 0);

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
        const rawMetadata = zapRunDetails?.metadata;
        const zapRunDetailsMetaData: Record<string, any> =
          rawMetadata &&
          typeof rawMetadata === "object" &&
          !Array.isArray(rawMetadata)
            ? (rawMetadata as Record<string, any>)
            : {};

        switch (currentAction.type.name) {
          case "email":
            console.log("Processing Email action");
            const emailTemplateContext = {
              ...zapRunDetailsMetaData,
              ai_output: zapRunDetailsMetaData.ai_output ?? "",
            };

            const configuredBody =
              ((currentAction.metadata as JsonObject).body as string) ?? "";
            const body =
              configuredBody.includes("{ai_output}") ||
              configuredBody.includes("{ai_output}")
                ? parse(configuredBody, emailTemplateContext)
                : `${configuredBody}${
                    configuredBody && emailTemplateContext.ai_output
                      ? "\n\n"
                      : ""
                  }${emailTemplateContext.ai_output}`;
            const to = parse(
              (currentAction.metadata as JsonObject).email as string,
              emailTemplateContext,
            );
            const subject = parse(
              ((currentAction.metadata as JsonObject).subject as string) ??
                "Hello from Zapier",
              emailTemplateContext,
            );

            await sendEmail(to, subject, body);
            break;
          case "openai":
          case "ai_summary":
            console.log("Processing AI action with Gemini");
            if (!ai) {
              throw new Error("GEMINI_API_KEY is not configured.");
            }

            const promptTemplate = parse(
              (currentAction.metadata as JsonObject).prompt as string,
              zapRunDetailsMetaData,
            );

            const response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: promptTemplate,
            });

            const aiResult = response.text ?? "";
            console.log(`Gemini AI Output: ${aiResult}`);

            zapRunDetailsMetaData.ai_output = aiResult;

            await prisma.zapRun.update({
              where: { id: zapRunId },
              data: {
                metadata: zapRunDetailsMetaData,
              },
            });
            break;
          case "solana_send":
            console.log("Processing Solana send");
            const amount = parse(
              (currentAction.metadata as JsonObject).amount as string,
              zapRunDetailsMetaData,
            );
            const address = parse(
              (currentAction.metadata as JsonObject).address as string,
              zapRunDetailsMetaData,
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

        const nextAttempt = attempt + 1;

        if (nextAttempt <= MAX_RETRIES) {
          await requeueFailedMessage(
            producer,
            KAFKA_TOPIC,
            {
              ...parsedValue,
              zapRunId,
              stage,
            },
            nextAttempt,
            error,
          );

          await consumer.commitOffsets([
            {
              topic: KAFKA_TOPIC,
              partition: partition,
              offset: (Number(message.offset) + 1).toString(),
            },
          ]);
          return;
        }

        await prisma.zapRun
          .update({
            where: { id: zapRunId },
            data: {
              status: "FAILED",
            },
          })
          .catch(() => undefined);

        await consumer.commitOffsets([
          {
            topic: KAFKA_TOPIC,
            partition: partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ]);
      }
    },
  });
}

main();
