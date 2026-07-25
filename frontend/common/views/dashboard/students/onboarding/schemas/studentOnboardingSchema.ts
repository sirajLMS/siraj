import { z } from "zod";
import { AppLanguage, Gender, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

export const studentOnboardingSchema = z.object({
  parentId: z.string().optional().nullable(),
  name: z.string().min(3, "nameMinLength"),
  email: z.email({ message: "emailInvalid" }),
  password: z.string().min(8, "passwordRequired"),
  avatarUrl: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional().nullable(),
  language: z.enum(AppLanguage).optional().nullable(),
  status: z.enum(StudentStatus),
  primaryTeacherId: z.string().optional(),
});

export type StudentOnboardingFormData = z.infer<typeof studentOnboardingSchema>;
