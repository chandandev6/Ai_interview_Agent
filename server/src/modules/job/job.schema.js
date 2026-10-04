// GET /api/jobs/:id — jobId hum khud randomUUID() se banate hai, to UUID hi hona chahiye
import { z } from "zod";

export const jobIdParamsSchema = z.object({
    id: z.uuid({ error: "Invalid job id" }),
});
