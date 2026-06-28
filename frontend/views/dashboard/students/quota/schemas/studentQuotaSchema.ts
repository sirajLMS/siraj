import { z } from "zod";
import type { MessageSchema } from "@/shared/messages/types/message";

export const createStudentQuotaSchema = (messages: MessageSchema["dashboard"]["studentQuota"]["validation"]) => {
  return z.object({
    studentName: z.string().min(1, messages.nameRequired),
    dateOfBirth: z.string().min(1, messages.dobRequired),
    language: z.enum(["ar", "en"] as const, { message: messages.languageRequired }),
    gender: z.enum(["MALE", "FEMALE"] as const, { message: messages.genderRequired }),
    teacher: z.string().min(1, messages.teacherRequired),
    totalClasses: z.coerce.number({ message: messages.totalClassesRequired }).min(0, messages.totalClassesMin),
    classesLeft: z.coerce.number({ message: messages.classesLeftRequired }).min(0, messages.classesLeftMin),
  });
};

export type StudentQuotaFormData = z.infer<ReturnType<typeof createStudentQuotaSchema>>;
export type StudentQuotaFormInput = z.input<ReturnType<typeof createStudentQuotaSchema>>;
