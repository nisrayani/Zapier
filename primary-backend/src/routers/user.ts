import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { SignupSchema, SigninSchema } from "../types/index.js";
import prisma from "../db/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const parsedData = SignupSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(411).json({
      message: "Validation failed",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsedData.data.email },
  });

  if (existingUser) {
    return res.status(402).json({ message: "Email already exists" });
  }

  const newUser = await prisma.user.create({
    data: {
      name: parsedData.data.name,
      email: parsedData.data.email,
      // TODO: In a real application, make sure to hash the password before storing it
      password: parsedData.data.password, // In a real application, make sure to hash the password before storing it
    },
  });

  // TODO: Send verification email
  res.send(
    `User signed up successfully,  userId:  ${newUser.id}, Please check your email, to verify your account`,
  );
});

router.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(411).json({
      message: "Validation failed",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsedData.data.email, password: parsedData.data.password },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // send jwt
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);

  res.json({
    message: "User logged in successfully",
    token,
  });
});

router.get("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

export const userRouter = router;
