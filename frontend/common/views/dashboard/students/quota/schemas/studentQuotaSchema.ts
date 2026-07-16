import { z } from "zod";
import type { Translations } from "@/shared/locale";

export const createStudentQuotaSchema = (
  messages: Translations["dashboardTranslations"]["studentQuota"]["validation"]
) => {
  return z.object({
    studentName: z.string().min(1, messages.nameRequired),
    dateOfBirth: z.string().min(1, messages.dobRequired),
    language: z.enum(["ar", "en"] as const, { message: messages.languageRequired }),
    gender: z.union([z.enum(["MALE", "FEMALE"] as const), z.literal("")]),
    teacher: z.string().min(1, messages.teacherRequired),
    totalClasses: z.coerce.number({ message: messages.totalClassesRequired }).min(0, messages.totalClassesMin),
    classesLeft: z.coerce.number({ message: messages.classesLeftRequired }).min(0, messages.classesLeftMin),
  });
};

export type StudentQuotaFormData = z.infer<ReturnType<typeof createStudentQuotaSchema>>;
export type StudentQuotaFormInput = z.input<ReturnType<typeof createStudentQuotaSchema>>;
