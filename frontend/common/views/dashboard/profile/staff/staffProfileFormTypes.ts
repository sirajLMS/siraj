import { z } from "zod";
import { AccountStatus, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  displayCurrency: z.enum(CurrencyCode).nullable().optional(),
  phone: z.string().optional(),
});

const adminStaffSchema = z.object({
  status: z.enum(AccountStatus).optional(),
  hourlyRate: z.string().optional(),
  rateCurrency: z.enum(CurrencyCode).nullable().optional(),
});

export const staffOwnEditSchema = coreSchema;
export const staffAdminEditSchema = z.object({ ...coreSchema.shape, ...adminStaffSchema.shape });

export type StaffOwnEditFormData = z.infer<typeof staffOwnEditSchema>;
export type StaffAdminEditFormData = z.infer<typeof staffAdminEditSchema>;
