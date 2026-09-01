import { z } from "zod";
import { CurrencyCode, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";

export type ParentProfileValidationLabels = {
  readonly invalidTimezone: string;
};

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  avatarUrl: z.string().nullable().optional(),
  displayCurrency: z.enum(CurrencyCode).nullable().optional(),
});

const ownParentSchema = z.object({
  phone: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  twitter: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
});

const adminParentSchema = ownParentSchema.extend({
  lifecycleStatus: z.enum(ParentStatus).optional(),
  invoiceType: z.string().optional(),
  feeAmount: z.string().optional(),
  currency: z.enum(CurrencyCode).optional(),
});

export const parentOwnEditSchemaFactory = (labels: ParentProfileValidationLabels) =>
  z.object({
    ...coreSchema.shape,
    ...ownParentSchema.shape,
    timezone: z
      .string()
      .optional()
      .refine(value => !value || isValidIanaTimezoneId(value), { message: labels.invalidTimezone }),
  });

export const parentAdminEditSchemaFactory = (labels: ParentProfileValidationLabels) =>
  z.object({
    ...coreSchema.shape,
    ...adminParentSchema.shape,
    timezone: z
      .string()
      .optional()
      .refine(value => !value || isValidIanaTimezoneId(value), { message: labels.invalidTimezone }),
  });

export type ParentAdminEditFormData = z.infer<ReturnType<typeof parentAdminEditSchemaFactory>>;

export type ParentEditData = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly avatarUrl?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly currency?: CurrencyCode | null;
  readonly timezone?: string | null;
  readonly lifecycleStatus?: ParentStatus | null;
};
