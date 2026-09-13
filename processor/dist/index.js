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
    // pull from outbound db and publish to kafka topic
    while (1) {
        const pendingZaps = await prisma.zapRun.findMany({
            where: {
                status: "PENDING",
            },
            take: 10,
        });
        producer.send({
            topic: KAFKA_TOPIC,
            messages: pendingZaps.map((zapRun) => ({
                // key: zap.id.toString(),
                value: zapRun.zapId,
            })),
        });
        console.log(`Published ${pendingZaps.length} zaps to Kafka topic ${KAFKA_TOPIC}`);
        await prisma.zapRun.deleteMany({
            where: {
                id: {
                    in: pendingZaps.map((zapRun) => zapRun.id),
                },
            }
        });
        console.log(`Deleting ${pendingZaps.length} zaps from Outbox table`);
    }
}
main();
//# sourceMappingURL=index.js.map