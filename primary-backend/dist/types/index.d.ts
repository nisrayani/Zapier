import { z } from "zod";
export declare const SignupSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const SigninSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const ZapCreateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    triggerTypeId: z.ZodString;
    triggerMetadata: z.ZodOptional<z.ZodAny>;
    actions: z.ZodArray<z.ZodObject<{
        actionTypeId: z.ZodString;
        actionMetadata: z.ZodOptional<z.ZodAny>;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map