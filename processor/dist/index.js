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
    console.log(`Connected to Kafka broker and ready to publish to topic ${KAFKA_TOPIC}`);
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
                value: zap.zapRunId.toString(),
            })),
        });
        console.log(`Published ${pendingZaps.length} zaps to Kafka topic ${KAFKA_TOPIC}`);
        await prisma.zapOutbox.deleteMany({
            where: {
                id: {
                    in: pendingZaps.map((zap) => zap.zapRunId),
                },
            }
        });
        console.log(`Deleting ${pendingZaps.length} zaps from Outbox table`);
    }
}
main();
//# sourceMappingURL=index.js.map