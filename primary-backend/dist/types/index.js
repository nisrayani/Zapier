import { z } from "zod";
export const SignupSchema = z.object({
    name: z.string().min(3, "UserName must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});
export const SigninSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});
//# sourceMappingURL=index.js.map