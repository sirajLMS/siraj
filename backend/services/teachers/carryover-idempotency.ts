import { createHash } from "node:crypto";
import type { BulkCreateCarryoverInput, BulkToExpenseInput, CreateCarryoverInput } from "@/backend/types";

/**
 * Determinism contract: a key depends only on the payload content, never on
 * object identity, key insertion order, or collection order. Identifier
 * collections are sorted before hashing so the same selection submitted in a
 * different order (a retried bulk action) re-derives the same key.
 *
 * Optional segments normalize `null`/`undefined` to an empty segment so those
 * two "absent" spellings hash identically. Values are hashed verbatim — no
 * date normalization, trimming, or case folding — so any real payload change
 * (including a payment-date change) yields a distinct key.
 */
function hashCarryoverParts(scope: string, parts: readonly string[]): string {
  return createHash("sha256")
    .update([scope, ...parts].join(":"))
    .digest("hex");
}

/**
 * Key for the bulk carryover-creation service: the acting operator plus the
 * sorted set of audited class-instance ids being aggregated. The free-text
 * note is excluded so a retried submission whose only difference is the note
 * still collapses onto the first result.
 */
export function deriveBulkCreateIdempotencyKey(input: BulkCreateCarryoverInput): string {
  const sortedInstanceIds = input.instanceIds.toSorted((a, b) => a.localeCompare(b));
  return hashCarryoverParts("carryover-bulk-create", [input.actorUserId, ...sortedInstanceIds]);
}

/**
 * Key for the bulk carryover-to-expense conversion: the acting operator, the
 * sorted set of carryover balances being converted, and the payout parameters
 * (payment date, expense month, note). A payment-date change is a genuinely
 * different instruction and therefore produces a different key.
 */
export function deriveBulkToExpenseIdempotencyKey(input: BulkToExpenseInput): string {
  const sortedCarryoverIds = input.carryoverIds.toSorted((a, b) => a.localeCompare(b));
  return hashCarryoverParts("carryover-bulk-to-expense", [
    input.actorUserId,
    input.paymentDate,
    input.expenseDate ?? "",
    input.note ?? "",
    ...sortedCarryoverIds,
  ]);
}

/**
 * Key for the single-record carryover create path: the acting operator plus the
 * full identifying payload (teacher, period, amount, currency, student summary,
 * note) and the client-supplied request id when provided. Free-text fields are
 * hashed raw, before sanitization, so a retried submission hashes identically
 * regardless of how the sanitizer alters the text. A re-submit that tampers
 * with any payload field lands on a different key and processes normally
 * instead of silently replaying the earlier result.
 */
export function deriveCrudIdempotencyKey(input: CreateCarryoverInput): string {
  return hashCarryoverParts("carryover-crud-create", [
    input.actorUserId,
    input.teacherId,
    input.fromDate ?? "",
    input.toDate ?? "",
    input.payable,
    input.teacherCurrency,
    String(input.studentsCount ?? ""),
    input.studentsText ?? "",
    input.note ?? "",
    input.clientRequestId ?? "",
  ]);
}
