import { z } from "zod";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export const createQuotaSchema = (messages: QuotaLabels) => {
  return z.object({
    studentId: z.string().min(1, messages.fields.student),
    name: z.string().min(1, messages.fields.name),
    kind: z.nativeEnum(QuotaKind),
    totalClasses: z.coerce.number().min(1, messages.fields.totalClasses),
    validFrom: z.string().nullable().optional(),
    validUntil: z.string().nullable().optional(),
    periodType: z.nativeEnum(QuotaPeriodType).nullable().optional(),
    periodDays: z.number().nullable().optional(),
    priority: z.coerce.number().min(0).default(10),
  });
};

export const createQuotaEditSchema = (messages: QuotaLabels) => {
  return z.object({
    name: z.string().min(1, messages.fields.name),
    validUntil: z.string().nullable().optional(),
    priority: z.coerce.number().min(0),
  });
};

export type QuotaFormData = z.infer<ReturnType<typeof createQuotaSchema>>;
export type QuotaFormInput = z.input<ReturnType<typeof createQuotaSchema>>;
export type QuotaEditFormData = z.infer<ReturnType<typeof createQuotaEditSchema>>;
export type QuotaEditFormInput = z.input<ReturnType<typeof createQuotaEditSchema>>;
