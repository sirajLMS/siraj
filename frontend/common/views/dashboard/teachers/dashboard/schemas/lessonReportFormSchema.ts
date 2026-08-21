import { z } from "zod";
import { AttendanceEvaluation } from "@/frontend/common/graphql/generated/gql/graphql";
import type { LessonReportFormLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";

export const lessonReportFormSchema = (labels: LessonReportFormLabels) =>
  z.object({
    attendanceEvaluation: z.enum(AttendanceEvaluation, {
      message: labels.attendanceRequired,
    }),
    durationMinutes: z
      .number({ message: labels.durationMin })
      .int(labels.durationMin)
      .min(1, labels.durationMin)
      .max(600, labels.durationMax),
    completionPercentage: z
      .number({ message: labels.completionMin })
      .int()
      .min(0, labels.completionMin)
      .max(100, labels.completionMax),
    teacherNotes: z.string().optional().default(""),
  });

export type LessonReportFormData = z.infer<ReturnType<typeof lessonReportFormSchema>>;
