import { createHash } from "node:crypto";
import type { CalculationStatus } from "@/backend/enum";

/**
 * Identifying fields of a payroll-override request that participate in the
 * idempotency key. Structurally a subset of the override input consumed by
 * the payroll service: the acting operator and the client-generated request
 * id are deliberately excluded so a double-clicked submission and another
 * operator repeating the identical override collapse onto the same key.
 */
export interface PayrollOverrideIdempotencyInput {
  instanceId: string;
  targetStatus: CalculationStatus;
  partialPercentage?: number | null;
  note?: string | null;
  force?: boolean;
}

/**
 * Derives the deterministic idempotency key for a payroll override.
 * Serializes the identifying fields in a fixed order (absent optional
 * fields normalize to empty segments) and hashes them with SHA-256.
 */
export function deriveOverrideIdempotencyKey(input: PayrollOverrideIdempotencyInput): string {
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
