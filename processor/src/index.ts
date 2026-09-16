import { PrismaClient, Status } from "@prisma/client";
import { Kafka } from "kafkajs";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});
const KAFKA_TOPIC = "zap-events";

async function main() {
  const producer = kafka.producer();
  await producer.connect();
  console.log(
    `Connected to Kafka broker and ready to publish to topic ${KAFKA_TOPIC}`,
  );

  // pull from outbound db and publish to kafka topic
  while (1) {
    const pendingZaps = await prisma.zapOutbox.findMany({
      where: {
        // status: "PENDING",
      },
      take: 10,
    });

    await producer.send({
      topic: KAFKA_TOPIC,
      messages: pendingZaps.map((zap) => ({
        // key: zap.id.toString(),
        // stage : which stage you are running on, whether you are running 1st stage/(trigger), 2nd stage(1st action etc)
        value: JSON.stringify({ zapRunId: zap.zapRunId.toString(), stage: 0 }),
      })),
    });

    await prisma.zapOutbox.deleteMany({
      where: {
        zapRunId: {
          in: pendingZaps.map((zap) => zap.zapRunId),
        },
      },
    });
  }
}

main();
