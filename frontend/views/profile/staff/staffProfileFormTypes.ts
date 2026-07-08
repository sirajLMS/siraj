import { z } from "zod";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const ownStaffSchema = z.object({
  phone: z.string().optional(),
  skypeId: z.string().optional(),
});

const adminStaffSchema = ownStaffSchema.extend({
  status: z.nativeEnum(AccountStatus).optional(),
});

export const staffOwnEditSchema = coreSchema.merge(ownStaffSchema);
export const staffAdminEditSchema = coreSchema.merge(adminStaffSchema);

export type StaffOwnEditFormData = z.infer<typeof staffOwnEditSchema>;
export type StaffAdminEditFormData = z.infer<typeof staffAdminEditSchema>;
