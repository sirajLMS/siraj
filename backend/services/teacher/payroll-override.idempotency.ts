import { createHash } from "node:crypto";
import type { CalculationStatus } from "@/backend/enum";

/**
 * Identifying fields of a payroll-override request that participate in the
 * idempotency key. Structurally a subset of the override input consumed by
 * the payroll service; the acting operator is deliberately excluded so a
 * double-clicked submission and another operator repeating the identical
 * override collapse onto the same key.
 */
export interface PayrollOverrideIdempotencyInput {
  instanceId: string;
  targetStatus: CalculationStatus;
  partialPercentage?: number | null;
  note?: string | null;
  force?: boolean;
  /**
   * Client-generated idempotency token. When present (non-empty after
   * trimming) it REPLACES the content fields in the key: every
   * re-submission carrying the same token inside the window collapses onto
   * the first-applied result even when the operator edited the note or
   * percentage in between, while a different token starts a fresh override.
   * Absent, null, or blank tokens fall back to the content-derived key.
   */
  clientRequestId?: string | null;
}

/**
 * Derives the deterministic idempotency key for a payroll override.
 * A provided client request id keys the hash on (instanceId, token) alone;
 * otherwise the identifying content fields are serialized in a fixed order
 * (absent optional fields normalize to empty segments). Both schemes hash
 * with SHA-256 under distinct prefixes so a token can never collide with a
 * content-derived key, whatever characters the token carries.
 */
export function deriveOverrideIdempotencyKey(input: PayrollOverrideIdempotencyInput): string {
  const clientRequestId = input.clientRequestId?.trim() ?? "";
  if (clientRequestId.length > 0) {
    return createHash("sha256")
      .update(["payroll-override-client", input.instanceId, clientRequestId].join(":"))
      .digest("hex");
  }
  const parts = [
    "payroll-override",
    input.instanceId,
    input.targetStatus,
    String(input.partialPercentage ?? ""),
    input.note ?? "",
    String(input.force ?? false),
  ];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}
