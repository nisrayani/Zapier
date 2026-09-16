import { Router } from "express";
import prisma from "../db/index.js";

const router = Router();

router.get("/available", async (_req, res) => {
  const availableTriggers = await prisma.triggerType.findMany();
  res.json({ availableTriggers });
});

export const triggerRouter = router;
