import { z } from "zod";
import { AccountStatus, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";

export type StaffProfileValidationLabels = {
  readonly invalidTimezone: string;
};

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  avatarUrl: z.string().nullable().optional(),
  displayCurrency: z.enum(CurrencyCode).nullable().optional(),
  phone: z.string().optional(),
});

const adminStaffSchema = z.object({
  status: z.enum(AccountStatus).optional(),
  hourlyRate: z.string().optional(),
  rateCurrency: z.enum(CurrencyCode).nullable().optional(),
});

export const staffOwnEditSchemaFactory = (labels: StaffProfileValidationLabels) =>
  coreSchema.extend({
    timezone: z
      .string()
      .optional()
      .refine(value => !value || isValidIanaTimezoneId(value), { message: labels.invalidTimezone }),
  });

export const staffAdminEditSchemaFactory = (labels: StaffProfileValidationLabels) =>
  z.object({
    ...coreSchema.shape,
    ...adminStaffSchema.shape,
    timezone: z
      .string()
      .optional()
      .refine(value => !value || isValidIanaTimezoneId(value), { message: labels.invalidTimezone }),
  });

export type StaffOwnEditFormData = z.infer<ReturnType<typeof staffOwnEditSchemaFactory>>;
export type StaffAdminEditFormData = z.infer<ReturnType<typeof staffAdminEditSchemaFactory>>;
