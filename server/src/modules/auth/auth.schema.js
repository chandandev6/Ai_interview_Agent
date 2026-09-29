// auth routes ke request ka shape — validate() middleware isse check karta hai
import { z } from "zod";

export const googleSchema = z.object({
    // field hi nahi bheja → "required", galat type bheja → "must be a string"
    idToken: z
        .string({ error: (issue) => (issue.input === undefined ? "idToken is required" : "idToken must be a string") })
        .min(1, "idToken is required"),
});
