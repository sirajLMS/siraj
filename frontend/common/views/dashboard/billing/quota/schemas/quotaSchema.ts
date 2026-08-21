import { z } from "zod";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export const createQuotaSchema = (messages: QuotaLabels) => {
  return z
    .object({
      studentId: z.string().min(1, messages.fields.student),
      name: z.string().min(1, messages.fields.name),
      kind: z.enum(QuotaKind),
      totalClasses: z.coerce.number().min(1, messages.fields.totalClasses),
      validFrom: z.string().nullable().optional(),
      validUntil: z.string().nullable().optional(),
      periodType: z.enum(QuotaPeriodType).nullable().optional(),
      periodDays: z.coerce.number().nullable().optional(),
      priority: z.coerce.number().min(0).default(10),
    })
    .superRefine((data, ctx) => {
      if (data.periodType === QuotaPeriodType.Custom && !data.periodDays) {
        ctx.addIssue({
          code: "custom",
          message: messages.fields.periodDaysRequired,
          path: ["periodDays"],
        });
      }
      if (data.validFrom && data.validUntil && data.validFrom > data.validUntil) {
        ctx.addIssue({
          code: "custom",
          message: messages.fields.validUntilAfterValidFrom,
          path: ["validUntil"],
        });
      }
    });
};

export const createQuotaEditSchema = (messages: QuotaLabels) => {
  return z
    .object({
      name: z.string().min(1, messages.fields.name),
      validFrom: z.string().nullable().optional(),
      validUntil: z.string().nullable().optional(),
      priority: z.coerce.number().min(0),
    })
    .superRefine((data, ctx) => {
      if (data.validFrom && data.validUntil && data.validFrom > data.validUntil) {
        ctx.addIssue({
          code: "custom",
          message: messages.fields.validUntilAfterValidFrom,
          path: ["validUntil"],
        });
      }
    });
};

export type QuotaFormData = z.infer<ReturnType<typeof createQuotaSchema>>;
export type QuotaFormInput = z.input<ReturnType<typeof createQuotaSchema>>;
export type QuotaEditFormData = z.infer<ReturnType<typeof createQuotaEditSchema>>;
export type QuotaEditFormInput = z.input<ReturnType<typeof createQuotaEditSchema>>;
