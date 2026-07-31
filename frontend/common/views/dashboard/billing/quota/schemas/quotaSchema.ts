import { z } from "zod";
import { QuotaKind, QuotaPeriodType, QuotaStatus } from "@/backend/enum";

export const createQuotaSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  kind: z.nativeEnum(QuotaKind),
  name: z.string().min(1, "Quota name is required").max(100),
  totalClasses: z.number().int().positive("Total classes must be a positive integer"),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  periodType: z.nativeEnum(QuotaPeriodType).nullable().optional(),
  periodDays: z.number().int().positive().nullable().optional(),
  priority: z.number().int().min(0).default(10),
});

export const updateQuotaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  validUntil: z.string().nullable().optional(),
  status: z.nativeEnum(QuotaStatus).optional(),
  priority: z.number().int().min(0).optional(),
  version: z.number().int().min(1),
});

export type CreateQuotaFormValues = z.infer<typeof createQuotaSchema>;
export type UpdateQuotaFormValues = z.infer<typeof updateQuotaSchema>;
