import { Router } from "express";
import prisma from "../db/index.js";

const router = Router();

router.get("/available", async (_req, res) => {
  const availableActions = await prisma.actionType.findMany();
  res.json({ availableActions });
});

export const actionRouter = router;
