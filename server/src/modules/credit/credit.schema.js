import { z } from "zod";

export const transactionsQuerySchema = z.object({
    page: z.coerce.number().int().min(1, "page must be 1 or more").default(1),
    limit: z.coerce.number().int().min(1).max(50, "limit must be at most 50").default(10),
});
