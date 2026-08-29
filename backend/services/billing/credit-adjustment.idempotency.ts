import { createHash } from "node:crypto";
import type { CreditAdjustmentType } from "@/backend/enum";

/**
 * Identifying fields of a credit-adjustment request that participate in the
 * idempotency key. Structurally a subset of the service-layer adjustment
 * input: the free-text reason is deliberately excluded so that two operators
 * submitting the same numeric adjustment with different reasons are not
 * silently collapsed into a single ledger entry.
 */
export interface CreditAdjustmentIdempotencyInput {
  studentId: string;
  adjustmentType: CreditAdjustmentType;
  hours: number;
  carryoverTeacherId?: string | null;
  carryoverFromDate?: string | null;
  carryoverToDate?: string | null;
  carryoverPaymentDate?: string | null;
}

/**
 * Derives the deterministic idempotency key for a credit adjustment.
 * Serializes the identifying fields in a fixed order (missing carryover
 * fields normalize to empty segments) and hashes them with SHA-256.
 */
export function deriveAdjustmentIdempotencyKey(input: CreditAdjustmentIdempotencyInput): string {
  const parts = [
    "credit-adjustment",
    input.studentId,
    input.adjustmentType,
    String(input.hours),
    input.carryoverTeacherId ?? "",
    input.carryoverFromDate ?? "",
    input.carryoverToDate ?? "",
    input.carryoverPaymentDate ?? "",
  ];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}
