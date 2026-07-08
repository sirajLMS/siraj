import { z } from "zod";

const coreSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const ownParentSchema = z.object({
  phone: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  twitter: z.string().optional(),
  skype: z.string().optional(),
  defaultZoomLink: z.string().optional(),
});

const adminParentSchema = ownParentSchema.extend({
  nationality: z.string().optional(),
  address: z.string().optional(),
  invoiceType: z.string().optional(),
  feeAmount: z.string().optional(),
  paymentMethod: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

export const parentOwnEditSchema = coreSchema.merge(ownParentSchema);
export const parentAdminEditSchema = coreSchema.merge(adminParentSchema);

export type ParentOwnEditFormData = z.infer<typeof parentOwnEditSchema>;
export type ParentAdminEditFormData = z.infer<typeof parentAdminEditSchema>;

export type ParentEditData = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly skype?: string | null;
  readonly defaultZoomLink?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly paymentMethod?: string | null;
  readonly currency?: string | null;
  readonly timezone?: string | null;
};
