import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { ZapCreateSchema } from "../types/index.js";
import prisma from "../db/index.js";

const router = Router();

router.post("/create", authMiddleware, async (req, res) => {
  const zapCreateData = ZapCreateSchema.safeParse(req.body);
  if (!zapCreateData.success) {
    return res.status(400).json({
      message: "Validation failed",
    });
  }

  await prisma.$transaction(async (prisma) => {
    const trigger = await prisma.trigger.create({
      data: {
        typeId: zapCreateData.data.triggerTypeId,
        // metadata: zapCreateData.data.triggerMetadata,
      },
    });
  });
  res.send("Zap created successfully");
});

router.post("/signin", authMiddleware, (req, res) => {
  // Handle user login logic here
  res.send("User logged in successfully");
});

router.get("/user", authMiddleware, (req, res) => {
  // Handle fetching user profile logic here
  res.send("User profile data");
});

export const zapRouter = router;
