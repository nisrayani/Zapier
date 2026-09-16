import express from "express";
import { PrismaClient, Status } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

//https://hooks.zapier.com/hooks/catch/28795500/4hv65rz/

app.post("/hooks/catch/:userId/:zapId/", async (req, res) => {
  var userId = req.params.userId;
  var zapId = req.params.zapId;
  var body = req.body;
  console.log(`Received webhook for userId: ${userId}, zapId: ${zapId}`);

  // store new trigger to db
  await prisma.$transaction(async (tx) => {
    const zapRun = await tx.zapRun.create({
      data: {
        zapId: zapId,
        status: Status.PENDING,
        metadata: body,
      },
    });
    console.log(`Created new ZapRun with id: ${zapRun.id}`);

    const zapOutbox = await tx.zapOutbox.create({
      data: {
        zapRunId: zapRun.id,
        status: Status.PENDING,
      },
    });
    console.log(`Created new ZapOutbox with id: ${zapOutbox.id}`);
  });

  res.status(200).send("Webhook received");
  // push that to queue kafka/redis
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
