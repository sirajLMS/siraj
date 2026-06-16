import { z } from "zod";

export const statusUpdateSchema = z.object({
  status: z.enum(["regular", "suspended", "on-leave"]),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters long" }),
});

export type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;
