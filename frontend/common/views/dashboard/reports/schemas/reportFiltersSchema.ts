import { z } from "zod";

export type ReportFiltersValidationLabels = {
  readonly invalidDateRange: string;
};

export const reportFiltersSchemaFactory = (labels: ReportFiltersValidationLabels) =>
  z
    .object({
      fromDate: z.string().min(1),
      toDate: z.string().min(1),
      teacherId: z.string(),
      reportType: z.enum(["by_teacher", "by_student", "by_date"]),
    })
    .refine(
      data => {
        if (data.fromDate.length === 0 || data.toDate.length === 0) {
          return true;
        }
        return data.fromDate <= data.toDate;
      },
      { message: labels.invalidDateRange, path: ["toDate"] }
    );

export type ReportFiltersFormValues = z.infer<ReturnType<typeof reportFiltersSchemaFactory>>;
