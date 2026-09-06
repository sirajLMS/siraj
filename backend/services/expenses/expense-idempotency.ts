import { createHash } from "node:crypto";
import type { CreateExpenseInput } from "@/backend/types";

/**
 * Determinism contract: a key depends only on the payload content, never on
 * object identity or key insertion order. Optional segments normalize
 * `null`/`undefined` to an empty segment so those two "absent" spellings hash
 * identically. Values are hashed verbatim — the raw, pre-sanitization text —
 * so a retried double-submit hashes identically while any real payload change
 * yields a distinct key.
 */

/**
 * Key for the expense-create service: the submitting user, the client-supplied
 * request id, and the full identifying payload. The note is excluded so a
 * retried submission whose only difference is the note still collapses onto
 * the first result (the note is descriptive, not identity).
 */
export function deriveCreateIdempotencyKey(input: CreateExpenseInput): string {
  return createHash("sha256")
    .update(
      [
        "expense-create",
        input.createdByUserId,
        input.clientRequestId ?? "",
        input.title,
        input.type,
        input.expenseValue,
        input.expenseCurrency,
        input.paymentDate,
        input.expenseDate,
        input.teacherId ?? "",
        input.sourceEntity ?? "",
        input.sourceEntityId ?? "",
      ].join(":")
    )
    .digest("hex");
}
