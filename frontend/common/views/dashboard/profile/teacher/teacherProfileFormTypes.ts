import { z } from "zod";
import { AccountStatus, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { isValidNationalId } from "@/shared/lib/national-id";

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
  readonly invalidTimezone: string;
};

const ownTeacherSchemaBase = z.object({
  phone: z.string().optional(),
  nationality: z.string().optional(),
  countryCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(Gender).optional().nullable(),
  address: z.string().optional(),
  qualifications: z.string().optional(),
});

const timezoneField = (invalidTimezone: string) =>
  z
    .string()
    .optional()
    .refine(value => !value || isValidIanaTimezoneId(value), { message: invalidTimezone });

/**
 * Build the own-profile edit schema with translated validation messages.
 *
 * `nationalId` is required for a teacher to operate on the system (enforced on
 * first login via the dashboard guard). It is an object `{ countryCode, number }`
 * whose format is validated against its own `countryCode` (falling back to the
 * selected `nationality`) via `isValidNationalId`.
 *
 * Note: `nationalId` is declared `.optional()` so the inferred form type keeps
 * it optional — this preserves structural compatibility with the shared
 * `AccountSection`/`ContactSection` controls (which expect a subset of fields).
 * Required-ness is enforced via the `superRefine` below, which rejects
 * missing/empty values.
 */
export const teacherOwnEditSchemaFactory = (labels: TeacherProfileValidationLabels) =>
  z
    .object({
      ...coreSchema.shape,
      ...ownTeacherSchemaBase.shape,
      timezone: timezoneField(labels.invalidTimezone),
      nationalId: z
        .object({
          countryCode: z.string().nullable().optional(),
          number: z.string(),
        })
        .nullable()
        .optional(),
    })
    .superRefine((data, ctx) => {
      // Enforce required: missing/empty nationalId is invalid.
      const nationalId = data.nationalId;
      if (!nationalId || nationalId.number.trim() === "") {
        ctx.addIssue({
          code: "custom" as const,
          path: ["nationalId"],
          message: labels.nationalIdRequired,
        });
        return;
      }
      if (
        !isValidNationalId({
          countryCode: nationalId.countryCode ?? data.nationality ?? null,
          number: nationalId.number,
        })
      ) {
        ctx.addIssue({
          code: "custom" as const,
          path: ["nationalId"],
          message: labels.nationalIdInvalid,
        });
      }
    });

const adminTeacherSchemaBase = ownTeacherSchemaBase.extend({
  nationalId: z
    .object({
      countryCode: z.string().nullable().optional(),
      number: z.string(),
    })
    .nullable()
    .optional(),
  hourlyRate: z.string().optional(),
  rateCurrency: z.enum(CurrencyCode).optional(),
  status: z.enum(AccountStatus).optional().nullable(),
});

export const teacherAdminEditSchemaFactory = (labels: Pick<TeacherProfileValidationLabels, "invalidTimezone">) =>
  z.object({
    ...coreSchema.shape,
    ...adminTeacherSchemaBase.shape,
    timezone: timezoneField(labels.invalidTimezone),
  });

export type TeacherOwnEditFormData = z.infer<ReturnType<typeof teacherOwnEditSchemaFactory>>;
export type TeacherAdminEditFormData = z.infer<ReturnType<typeof teacherAdminEditSchemaFactory>>;

export type TeacherEditData = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly avatarUrl?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
  /** Prefill-friendly national ID object; `number` may be masked in admin views. */
  readonly nationalId?: { readonly countryCode?: string | null; readonly number?: string | null } | null;
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
