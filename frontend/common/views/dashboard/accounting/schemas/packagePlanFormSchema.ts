import { z } from "zod";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

/**
 * Package plan form schema — mirrors PackagePlanInput (create) and
 * PackagePlanUpdateInput (edit adds the optimistic-lock `version`).
 * Codename is the stable integration key: letters/digits/dash/underscore.
 */
export const createPackagePlanFormSchema = (messages: PackagePlansLabels) =>
  z.object({
    codename: z
      .string()
      .min(2, messages.form.codename)
      .max(50, messages.form.codename)
      .regex(/^[A-Za-z0-9_-]+$/, messages.form.codenameHelp),
    displayName: z.string().min(1, messages.form.displayName),
    description: z.string().nullable(),
    creditHours: z.coerce.number().positive(messages.form.creditHours),
    priceAmount: z.coerce.number().min(0, messages.form.priceAmount),
    currency: z.enum(CurrencyCode),
    active: z.boolean(),
    sortOrder: z.coerce.number().int().min(0, messages.form.sortOrder),
  });

export type PackagePlanFormData = z.infer<ReturnType<typeof createPackagePlanFormSchema>>;
export type PackagePlanFormInput = z.input<ReturnType<typeof createPackagePlanFormSchema>>;
