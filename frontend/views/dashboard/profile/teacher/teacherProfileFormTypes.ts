import { z } from "zod";
import { AccountStatus, Gender, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/lib/timezone";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

const ownTeacherSchema = z.object({
  phone: z.string().optional(),
  zoomLink: z.string().optional(),
});

const adminTeacherSchema = ownTeacherSchema.extend({
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional().nullable(),
  address: z.string().optional(),
  qualifications: z.string().optional(),
  zoomUsername: z.string().optional(),
  zoomPassword: z.string().optional(),
  timezone: z
    .string()
    .optional()
    .refine(value => !value || isValidIanaTimezoneId(value), { message: "Invalid timezone" }),
  hourlyRate: z.string().optional(),
  rateCurrency: z.string().optional(),
  paymentMethod: z.enum(PaymentMethod).optional().nullable(),
  status: z.enum(AccountStatus).optional().nullable(),
});

export const teacherOwnEditSchema = z.object({ ...coreSchema.shape, ...ownTeacherSchema.shape });
export const teacherAdminEditSchema = z.object({ ...coreSchema.shape, ...adminTeacherSchema.shape });

export type TeacherOwnEditFormData = z.infer<typeof teacherOwnEditSchema>;
export type TeacherAdminEditFormData = z.infer<typeof teacherAdminEditSchema>;

export type TeacherEditData = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly zoomLink?: string | null;
  readonly nationalId?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: Gender | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly zoomUsername?: string | null;
  readonly timezone?: string | null;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: string | null;
  readonly paymentMethod?: PaymentMethod | null;
  readonly status?: AccountStatus | null;
};
