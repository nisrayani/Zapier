import { PrismaClient } from "@prisma/client";
import { Kafka } from "kafkajs";

const prisma = new PrismaClient();
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});
const KAFKA_TOPIC = "zap-events";

async function main() {
  const consumer = kafka.consumer({ groupId: "main-worker" });
  await consumer.connect();
  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
  console.log(`Connected to Kafka broker and ready to consume from topic ${KAFKA_TOPIC}`);

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received event from topic ${topic}:`, message.value?.toString());

        // process it
        await new Promise((resolve) => setTimeout(resolve, 5000));
        console.log(`Processed event from topic ${topic}:`, message.value?.toString());

        // manual ack to kafka that the message has been processed
        // this ensures that message is not lost from kafka in case the server crashes before the message is processed
        consumer.commitOffsets([{ 
            topic: KAFKA_TOPIC, 
            partition: partition, 
            offset: (parseInt(message.offset) + 1).toString() 
        }]);
        },
  });
}

main()