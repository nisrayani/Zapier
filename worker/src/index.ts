import { PrismaClient } from "@prisma/client";
import type { JsonObject } from "@prisma/client/runtime/library";
import { Kafka } from "kafkajs";
import { GoogleGenAI } from "@google/genai";
import { parse } from "./parser.js";
import { sendEmail } from "./email.js";
import { sendSol } from "./solana.js";

function normalizeGitHubContext(rawMetadata: Record<string, any>) {
  const source = rawMetadata ?? {};

  const repository = source.repository ??
    source.repo ?? {
      name: source.name ?? "",
      full_name: source.full_name ?? "",
      html_url: source.html_url ?? "",
    };

  const pullRequest = source.pull_request ??
    source.pullRequest ?? {
      number: source.number ?? "",
      title: source.title ?? "",
      html_url: source.html_url ?? "",
      body: source.body ?? "",
    };

  const sender = source.sender ?? source.user ?? {};
  const action = source.action ?? "unknown";

  return {
    raw: source,
    action,
    repository,
    pull_request: pullRequest,
    sender,
    repository_name: repository.name ?? "",
    repository_full_name: repository.full_name ?? "",
    pull_request_number: pullRequest.number ?? "",
    pull_request_title: pullRequest.title ?? "",
    pull_request_url: pullRequest.html_url ?? "",
    sender_login: sender.login ?? "",
    sender_name: sender.name ?? sender.login ?? "",
    ref: source.ref ?? "",
    pusher: source.pusher ?? {},
    head_commit: source.head_commit ?? {},
  };
}

function buildWorkflowContext(rawMetadata: Record<string, any>) {
  const stepResults = Array.isArray(rawMetadata.steps) ? rawMetadata.steps : [];

  const normalizedTriggerContext = normalizeGitHubContext(rawMetadata);
  const lastStepOutput =
    stepResults.length > 0
      ? (stepResults[stepResults.length - 1]?.output ?? "")
      : "";

  return {
    ...rawMetadata,
    trigger: normalizedTriggerContext,
    steps: stepResults,
    ai_output: rawMetadata.ai_output ?? lastStepOutput,
  };
}

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
  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
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

        const stepResults: Record<string, any>[] = Array.isArray(
          zapRunDetailsMetaData.steps,
        )
          ? zapRunDetailsMetaData.steps
          : [];

        const workflowContext = buildWorkflowContext(zapRunDetailsMetaData);

        switch (currentAction.type.name) {
          case "email": {
            console.log("Processing Email action");
            const emailTemplateContext = {
              ...workflowContext,
              ai_output: workflowContext.ai_output ?? "",
            };

            const configuredBody =
              ((currentAction.metadata as JsonObject).body as string) ?? "";
            const body = parse(configuredBody, emailTemplateContext);
            const to = parse(
              (currentAction.metadata as JsonObject).email as string,
              emailTemplateContext,
            );
            const subject = parse(
              ((currentAction.metadata as JsonObject).subject as string) ??
                "Hello from Zapier",
              emailTemplateContext,
            );

            const emailResult = {
              actionType: "email",
              sortingOrder: stage,
              output: body,
            };

            const nextStepResults = [...stepResults, emailResult];
            await prisma.zapRun.update({
              where: { id: zapRunId },
              data: {
                metadata: {
                  ...zapRunDetailsMetaData,
                  trigger: workflowContext.trigger,
                  steps: nextStepResults,
                  ai_output: workflowContext.ai_output ?? "",
                },
              },
            });

            await sendEmail(to, subject, body);
            break;
          }
          case "openai":
          case "ai_summary": {
            console.log("Processing AI action with Gemini");
            if (!ai) {
              throw new Error("GEMINI_API_KEY is not configured.");
            }

            const promptTemplate = parse(
              (currentAction.metadata as JsonObject).prompt as string,
              workflowContext,
            );

            const response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: promptTemplate,
            });

            const aiResult = response.text ?? "";
            console.log(`Gemini AI Output: ${aiResult}`);

            const nextStepResults = [
              ...stepResults,
              {
                actionType: currentAction.type.name,
                sortingOrder: stage,
                output: aiResult,
              },
            ];

            const updatedWorkflowMetadata = {
              ...zapRunDetailsMetaData,
              trigger: workflowContext.trigger,
              steps: nextStepResults,
              ai_output: aiResult,
            };

            await prisma.zapRun.update({
              where: { id: zapRunId },
              data: {
                metadata: updatedWorkflowMetadata,
              },
            });
            break;
          }
          case "solana_send": {
            console.log("Processing Solana send");
            const amount = parse(
              (currentAction.metadata as JsonObject).amount as string,
              workflowContext,
            );
            const address = parse(
              (currentAction.metadata as JsonObject).address as string,
              workflowContext,
            );
            await sendSol(amount, address);
            break;
          }
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
