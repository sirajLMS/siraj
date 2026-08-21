import { z } from "zod";
import { ComplaintCategory } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ComplaintValidationLabels } from "@/shared/locale";

export const complaintFormSchema = (labels: ComplaintValidationLabels) =>
  z.object({
    category: z.enum(ComplaintCategory, {
      message: labels.categoryRequired,
    }),
    studentId: z.string().min(1, labels.studentRequired),
    contactEmail: z
      .string()
      .min(1, labels.emailRequired)
      .pipe(z.email({ message: labels.emailInvalid })),
    complaintDetails: z.string().min(10, labels.detailsRequired),
  });

export type ComplaintFormData = z.infer<ReturnType<typeof complaintFormSchema>>;
