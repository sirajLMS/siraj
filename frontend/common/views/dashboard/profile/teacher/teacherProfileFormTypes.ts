import { z } from "zod";
import { AccountStatus, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  displayCurrency: z.enum(CurrencyCode).nullable().optional(),
});

const ownTeacherSchema = z.object({
  phone: z.string().optional(),
});

const adminTeacherSchema = ownTeacherSchema.extend({
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional().nullable(),
  address: z.string().optional(),
  qualifications: z.string().optional(),
  timezone: z
    .string()
    .optional()
    .refine(value => !value || isValidIanaTimezoneId(value), { message: "Invalid timezone" }),
  hourlyRate: z.string().optional(),
  rateCurrency: z.enum(CurrencyCode).optional(),
  status: z.enum(AccountStatus).optional().nullable(),
});

export const teacherOwnEditSchema = z.object({ ...coreSchema.shape, ...ownTeacherSchema.shape });
export const teacherAdminEditSchema = z.object({ ...coreSchema.shape, ...adminTeacherSchema.shape });

export type TeacherOwnEditFormData = z.infer<typeof teacherOwnEditSchema>;
export type TeacherAdminEditFormData = z.infer<typeof teacherAdminEditSchema>;

export type TeacherEditData = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
  readonly nationalId?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: Gender | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly timezone?: string | null;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
  readonly status?: AccountStatus | null;
};
