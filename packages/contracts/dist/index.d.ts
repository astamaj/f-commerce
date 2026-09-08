import { z } from 'zod';
export declare const healthResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        status: z.ZodLiteral<"ok">;
    }, z.core.$strip>;
    message: z.ZodString;
}, z.core.$strip>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
