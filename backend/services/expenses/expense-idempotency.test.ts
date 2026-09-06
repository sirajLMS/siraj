import { describe, expect, test } from "bun:test";
import { ExpenseType } from "@/backend/enum";
import { deriveCreateIdempotencyKey } from "@/backend/services/expenses/expense-idempotency";
import type { CreateExpenseInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

const ACTOR_ID = "dddd1111-1111-4cc1-8111-111111111111";
const TEACHER_ID = "dddd2222-2222-4cc2-8222-222222222222";
const SOURCE_ID = "dddd3333-3333-4cc3-8333-333333333333";

function buildInput(overrides: Partial<CreateExpenseInput> = {}): CreateExpenseInput {
  return {
    title: "Office rent",
    type: ExpenseType.MARKETING,
    expenseValue: "100.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-01-15",
    expenseDate: "2026-01",
    createdByUserId: ACTOR_ID,
    clientRequestId: "req-1",
    ...overrides,
  };
}

describe("deriveCreateIdempotencyKey", () => {
  test("same input derives the same key", () => {
    expect(deriveCreateIdempotencyKey(buildInput())).toBe(deriveCreateIdempotencyKey(buildInput()));
  });

  test("a type change produces a different key", () => {
    expect(deriveCreateIdempotencyKey(buildInput())).not.toBe(
      deriveCreateIdempotencyKey(buildInput({ type: ExpenseType.TECHNOLOGY }))
    );
  });

  test("a payment-date change produces a different key", () => {
    expect(deriveCreateIdempotencyKey(buildInput())).not.toBe(
      deriveCreateIdempotencyKey(buildInput({ paymentDate: "2026-01-16" }))
    );
  });

  test("a clientRequestId change produces a different key", () => {
    expect(deriveCreateIdempotencyKey(buildInput())).not.toBe(
      deriveCreateIdempotencyKey(buildInput({ clientRequestId: "req-2" }))
    );
  });

  test("null and undefined optional segments hash identically", () => {
    expect(deriveCreateIdempotencyKey(buildInput({ teacherId: null }))).toBe(
      deriveCreateIdempotencyKey(buildInput({ teacherId: undefined }))
    );
  });

  test("provenance participates in the key", () => {
    const manual = buildInput();
    const settled = buildInput({
      sourceEntity: "carryover_balances",
      sourceEntityId: SOURCE_ID,
      teacherId: TEACHER_ID,
    });
    expect(deriveCreateIdempotencyKey(manual)).not.toBe(deriveCreateIdempotencyKey(settled));
  });

  test("free-text note does not participate in the key", () => {
    expect(deriveCreateIdempotencyKey(buildInput({ note: "first note" }))).toBe(
      deriveCreateIdempotencyKey(buildInput({ note: "edited note" }))
    );
  });

  test("produces a 64-char hex digest", () => {
    expect(deriveCreateIdempotencyKey(buildInput())).toMatch(/^[0-9a-f]{64}$/);
  });
});
