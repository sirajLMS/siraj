import { createHash } from "node:crypto";
import type { CreditAdjustmentType } from "@/backend/enum";

/**
 * Identifying fields of a credit-adjustment request that participate in the
 * idempotency key. Structurally a subset of the service-layer adjustment
 * input; the free-text reason (`notes`) is deliberately excluded so that a
 * retried submission whose only difference is the reason text still collapses
 * onto the already-persisted ledger row (the double-click guard).
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
 * Serializes the acting operator and the identifying fields in a fixed order
 * (missing carryover fields normalize to empty segments) and hashes them with
 * SHA-256. The actor participates in the key so that two distinct operators
 * submitting the same adjustment each get their own ledger row, while a
 * same-actor re-submit (e.g. a double-click or a network retry) collapses
 * onto the first persisted row.
 */
export function deriveAdjustmentIdempotencyKey(actorUserId: string, input: CreditAdjustmentIdempotencyInput): string {
  const parts = [
    "credit-adjustment",
    actorUserId,
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
