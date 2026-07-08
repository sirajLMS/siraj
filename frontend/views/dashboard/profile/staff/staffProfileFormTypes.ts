import { z } from "zod";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

const ownStaffSchema = z.object({
  phone: z.string().optional(),
});

const adminStaffSchema = ownStaffSchema.extend({
  status: z.enum(AccountStatus).optional(),
});

export const staffOwnEditSchema = z.object({ ...coreSchema.shape, ...ownStaffSchema.shape });
export const staffAdminEditSchema = z.object({ ...coreSchema.shape, ...adminStaffSchema.shape });

export type StaffOwnEditFormData = z.infer<typeof staffOwnEditSchema>;
export type StaffAdminEditFormData = z.infer<typeof staffAdminEditSchema>;
