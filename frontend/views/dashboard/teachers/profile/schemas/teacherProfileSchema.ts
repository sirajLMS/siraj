import { z } from "zod";
import { isValidIanaTimezoneId } from "@/frontend/lib/timezone";
import type { MessageSchema } from "@/shared/messages/types/message";

export const createTeacherProfileSchema = (messages: MessageSchema["dashboard"]["teacherProfile"]["validation"]) => {
  return z.object({
    fullName: z.string().min(1, messages.nameRequired),
    email: z.email({ message: messages.emailInvalid }),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]),
    timezone: z
      .string()
      .min(1, messages.timezoneRequired)
      .refine(value => isValidIanaTimezoneId(value), { message: messages.timezoneRequired }),
    address: z.string().optional(),
    baseSalary: z.coerce.number().min(0),
    currency: z.string(),
    paymentMethod: z.enum(["PAYPAL", "BANK_ACCOUNT"]),
    zoomLink: z.url().or(z.literal("")),
    accountStatus: z.boolean(),
  });
};

export type TeacherProfileFormData = z.infer<ReturnType<typeof createTeacherProfileSchema>>;
export type TeacherProfileFormInput = z.input<ReturnType<typeof createTeacherProfileSchema>>;
