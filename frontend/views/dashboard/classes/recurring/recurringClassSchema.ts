import { z } from "zod";

const dayScheduleSchema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  enabled: z.boolean(),
  timeOverride: z.string(),
  showOverride: z.boolean(),
  isWeekend: z.boolean(),
});

export const createRecurringClassSchema = (messages: {
  studentGroupRequired: string;
  startTimeRequired: string;
  durationRequired: string;
  daysRequired: string;
  durationHoursMax: string;
  durationMinutesMax: string;
}) => {
  return z
    .object({
      studentGroupId: z.string().min(1, messages.studentGroupRequired),
      defaultStartTime: z.string().min(1, messages.startTimeRequired),
      durationHours: z
        .number({ error: messages.durationRequired })
        .min(0, messages.durationRequired)
        .max(12, messages.durationHoursMax),
      durationMinutes: z
        .number({ error: messages.durationRequired })
        .min(0, messages.durationRequired)
        .max(59, messages.durationMinutesMax),
      days: z.array(dayScheduleSchema),
    })
    .refine(data => data.days.some(day => day.enabled && !day.isWeekend), {
      message: messages.daysRequired,
      path: ["days"],
    })
    .refine(data => data.durationHours > 0 || data.durationMinutes > 0, {
      message: messages.durationRequired,
      path: ["durationMinutes"],
    });
};

export type RecurringClassFormData = z.infer<ReturnType<typeof createRecurringClassSchema>>;
