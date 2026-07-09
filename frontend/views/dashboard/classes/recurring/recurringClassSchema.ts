import { z } from "zod";
import { DayOfWeek } from "@/frontend/graphql/generated/gql/graphql-types";
import { IANA_TIMEZONE_IDS } from "@/shared/constants/iana-timezones";

const dayScheduleSchema = z.object({
  day: z.enum(DayOfWeek),
  enabled: z.boolean(),
  timeOverride: z.string(),
  showOverride: z.boolean(),
  isWeekend: z.boolean(),
});

export const createRecurringClassSchema = (messages: {
  studentRequired: string;
  teacherRequired: string;
  startTimeRequired: string;
  durationRequired: string;
  daysRequired: string;
  durationHoursMax: string;
  durationMinutesMax: string;
  timezoneRequired: string;
}) => {
  return z
    .object({
      studentId: z.string().min(1, messages.studentRequired),
      teacherId: z.string().min(1, messages.teacherRequired),
      defaultStartTime: z.string().min(1, messages.startTimeRequired),
      durationHours: z
        .number({ error: messages.durationRequired })
        .min(0, messages.durationRequired)
        .max(12, messages.durationHoursMax),
      durationMinutes: z
        .number({ error: messages.durationRequired })
        .min(0, messages.durationRequired)
        .max(59, messages.durationMinutesMax),
      timezone: z
        .string()
        .min(1, messages.timezoneRequired)
        .refine(value => (IANA_TIMEZONE_IDS as readonly string[]).includes(value), {
          message: messages.timezoneRequired,
        }),
      classType: z.enum(["REGULAR", "TRIAL", "ADVANCE"]).optional(),
      effectiveFrom: z.string().optional(),
      effectiveUntil: z.string().optional(),
      generateInstancesForWeeks: z.number().min(1).max(12).optional(),
      days: z.array(dayScheduleSchema),
    })
    .refine(data => data.days.some(day => day.enabled), {
      message: messages.daysRequired,
      path: ["days"],
    })
    .refine(data => data.durationHours > 0 || data.durationMinutes > 0, {
      message: messages.durationRequired,
      path: ["durationMinutes"],
    });
};

export type RecurringClassFormData = z.infer<ReturnType<typeof createRecurringClassSchema>>;
