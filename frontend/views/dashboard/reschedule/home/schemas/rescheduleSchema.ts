import { z } from "zod";

export const rescheduleSchema = z.object({
  newDate: z.string().min(1, "dateRequired"),
  newTime: z.string().min(1, "timeRequired"),
});

export type RescheduleFormData = z.infer<typeof rescheduleSchema>;
