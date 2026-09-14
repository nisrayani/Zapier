import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(3, "UserName must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const SigninSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const ZapCreateSchema = z.object({
  triggerTypeId: z.string().min(1, "Trigger ID is required"),
  triggerMetadata: z.any().optional(),
  actions: z.array(
    z.object({
      actionTypeId: z.string().min(1, "Action ID is required"),
      actionMetadata: z.any().optional(),
    }),
  ),
});
