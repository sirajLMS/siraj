import { z } from "zod";
import { AppLanguage, CurrencyCode, Gender, IanaTimezone, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

export const studentOnboardingSchema = z.object({
  parentId: z.string().optional().nullable(),
  name: z.string().min(3, "nameMinLength"),
  email: z.email({ message: "emailInvalid" }),
  password: z.string().min(8, "passwordRequired"),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.custom<IanaTimezone>(
    val => typeof val === "string" && (Object.values(IanaTimezone) as readonly string[]).includes(val),
    { message: "timezoneRequired" }
  ),
  displayCurrency: z.enum(CurrencyCode).optional().nullable(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional().nullable(),
  language: z.enum(AppLanguage).optional().nullable(),
  status: z.enum(StudentStatus),
  primaryTeacherId: z.string().optional(),
});

export type StudentOnboardingFormData = z.infer<typeof studentOnboardingSchema>;
