import { z } from "zod";
import { AccountStatus, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { isValidNationalIdForCountry } from "@/shared/lib/national-id";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  avatarUrl: z.string().nullable().optional(),
  displayCurrency: z.enum(CurrencyCode).nullable().optional(),
});

/**
 * Validation labels injected at call time so error messages are translated.
 * Mirrors the `teacherOnboardingSchema` factory pattern.
 */
export type TeacherProfileValidationLabels = {
  readonly nationalIdRequired: string;
  readonly nationalIdInvalid: string;
};

const ownTeacherSchemaBase = z.object({
  phone: z.string().optional(),
  nationality: z.string().optional(),
  countryCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional().nullable(),
  address: z.string().optional(),
  qualifications: z.string().optional(),
  timezone: z
    .string()
    .optional()
    .refine(value => !value || isValidIanaTimezoneId(value), { message: "Invalid timezone" }),
});

/**
 * Build the own-profile edit schema with translated validation messages.
 *
 * `nationalId` is required for a teacher to operate on the system (enforced on
 * first login via the dashboard guard). Its format is validated against the
 * selected `nationality` via `isValidNationalIdForCountry`.
 *
 * Note: `nationalId` is declared `.optional()` so the inferred form type keeps
 * it as `string | undefined` — this preserves structural compatibility with the
 * shared `AccountSection`/`ContactSection` controls (which expect a subset of
 * fields). Required-ness is enforced via `.min(1, ...)` which only fires when a
 * value is present, plus the `superRefine` below rejects empty/whitespace.
 */
export const teacherOwnEditSchemaFactory = (labels: TeacherProfileValidationLabels) =>
  z
    .object({
      ...coreSchema.shape,
      ...ownTeacherSchemaBase.shape,
      nationalId: z
        .string()
        .optional()
        .refine(value => value?.trim() !== "", { message: labels.nationalIdRequired }),
    })
    .superRefine((data, ctx) => {
      // Enforce required: empty/whitespace/missing nationalId is invalid.
      if (!data.nationalId || data.nationalId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationalId"],
          message: labels.nationalIdRequired,
        });
        return;
      }
      if (!isValidNationalIdForCountry(data.nationalId, data.nationality)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationalId"],
          message: labels.nationalIdInvalid,
        });
      }
    });

const adminTeacherSchema = ownTeacherSchemaBase.extend({
  nationalId: z.string().optional(),
  hourlyRate: z.string().optional(),
  rateCurrency: z.enum(CurrencyCode).optional(),
  status: z.enum(AccountStatus).optional().nullable(),
});

/**
 * Backwards-compatible static schema (no translated messages). Used by callers
 * that don't yet inject labels. Prefer `teacherOwnEditSchemaFactory`.
 */
export const teacherOwnEditSchema = z.object({
  ...coreSchema.shape,
  ...ownTeacherSchemaBase.shape,
  nationalId: z.string().optional(),
});

export const teacherAdminEditSchema = z.object({ ...coreSchema.shape, ...adminTeacherSchema.shape });

export type TeacherOwnEditFormData = z.infer<ReturnType<typeof teacherOwnEditSchemaFactory>>;
export type TeacherAdminEditFormData = z.infer<typeof teacherAdminEditSchema>;

export type TeacherEditData = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly avatarUrl?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
  readonly nationalId?: string | null;
  readonly nationality?: string | null;
  readonly countryCode?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: Gender | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly timezone?: string | null;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
  readonly status?: AccountStatus | null;
};
