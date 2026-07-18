// NEW FOR PLAN v5 (newly created for the migration wave)
import { z } from "zod";

export const assignGroupSchema = z.object({
  userId: z.string().min(1, "userRequired"),
});

export type AssignGroupFormData = z.infer<typeof assignGroupSchema>;
