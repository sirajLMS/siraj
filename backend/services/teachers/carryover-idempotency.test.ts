import { describe, expect, test } from "bun:test";
import {
  deriveBulkCreateIdempotencyKey,
  deriveBulkToExpenseIdempotencyKey,
  deriveCrudIdempotencyKey,
} from "@/backend/services/teachers/carryover-idempotency";
import type { BulkCreateCarryoverInput, BulkToExpenseInput, CreateCarryoverInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

const OPERATOR_A = "operator-0000-0000-0000-000000000001";
const OPERATOR_B = "operator-0000-0000-0000-000000000002";
const INSTANCE_1 = "instance-0000-0000-0000-000000000001";
const INSTANCE_2 = "instance-0000-0000-0000-000000000002";
const INSTANCE_3 = "instance-0000-0000-0000-000000000003";
const CARRYOVER_1 = "carryover-0000-0000-0000-0000000001";
const CARRYOVER_2 = "carryover-0000-0000-0000-0000000002";
const TEACHER_A = "teacher-0000-0000-0000-000000000001";
const TEACHER_B = "teacher-0000-0000-0000-000000000002";

function bulkCreateInput(): BulkCreateCarryoverInput {
  return { instanceIds: [INSTANCE_1, INSTANCE_2, INSTANCE_3], actorUserId: OPERATOR_A };
}

function bulkToExpenseInput(): BulkToExpenseInput {
  return {
    carryoverIds: [CARRYOVER_1, CARRYOVER_2],
    paymentDate: "2026-09-01",
    expenseDate: "2026-09",
    note: "September payroll",
    actorUserId: OPERATOR_A,
  };
}

function crudInput(): CreateCarryoverInput {
  return {
    teacherId: TEACHER_A,
    fromDate: "2026-08-01",
    toDate: "2026-08-31",
    payable: "1200.00",
    teacherCurrency: CurrencyCode.EGP,
    actorUserId: OPERATOR_A,
    clientRequestId: "req-2026-09-05-001",
  };
}

describe("deriveBulkCreateIdempotencyKey", () => {
  test("same input produces the same key", () => {
    expect(deriveBulkCreateIdempotencyKey(bulkCreateInput())).toBe(deriveBulkCreateIdempotencyKey(bulkCreateInput()));
  });

  test("returns a lowercase 64-char hex sha256 digest", () => {
    expect(deriveBulkCreateIdempotencyKey(bulkCreateInput())).toMatch(/^[0-9a-f]{64}$/);
  });

  test("instance-id reordering produces the same key", () => {
    const reordered: BulkCreateCarryoverInput = {
      ...bulkCreateInput(),
      instanceIds: [INSTANCE_3, INSTANCE_1, INSTANCE_2],
    };
    expect(deriveBulkCreateIdempotencyKey(reordered)).toBe(deriveBulkCreateIdempotencyKey(bulkCreateInput()));
  });

  test("changing the instance set changes the key", () => {
    expect(deriveBulkCreateIdempotencyKey({ ...bulkCreateInput(), instanceIds: [INSTANCE_1, INSTANCE_2] })).not.toBe(
      deriveBulkCreateIdempotencyKey(bulkCreateInput())
    );
  });

  test("changing the actor changes the key", () => {
    expect(deriveBulkCreateIdempotencyKey({ ...bulkCreateInput(), actorUserId: OPERATOR_B })).not.toBe(
      deriveBulkCreateIdempotencyKey(bulkCreateInput())
    );
  });

  test("empty instance-id list still derives a stable key", () => {
    const empty: BulkCreateCarryoverInput = { instanceIds: [], actorUserId: OPERATOR_A };
    expect(deriveBulkCreateIdempotencyKey(empty)).toBe(deriveBulkCreateIdempotencyKey({ ...empty }));
    expect(deriveBulkCreateIdempotencyKey(empty)).not.toBe(deriveBulkCreateIdempotencyKey(bulkCreateInput()));
  });
});

describe("deriveBulkToExpenseIdempotencyKey", () => {
  test("same input produces the same key", () => {
    expect(deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput())).toBe(
      deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput())
    );
  });

  test("carryover-id reordering produces the same key", () => {
    const reordered: BulkToExpenseInput = { ...bulkToExpenseInput(), carryoverIds: [CARRYOVER_2, CARRYOVER_1] };
    expect(deriveBulkToExpenseIdempotencyKey(reordered)).toBe(deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput()));
  });

  test("payment-date change produces a different key", () => {
    expect(deriveBulkToExpenseIdempotencyKey({ ...bulkToExpenseInput(), paymentDate: "2026-09-02" })).not.toBe(
      deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput())
    );
  });

  test.each([
    ["expenseDate", "2026-10"],
    ["note", "September payroll — corrected"],
  ] as const)("changing %s changes the key", (field, value) => {
    expect(deriveBulkToExpenseIdempotencyKey({ ...bulkToExpenseInput(), [field]: value })).not.toBe(
      deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput())
    );
  });

  test("null and undefined optional fields normalize identically", () => {
    const withNulls: BulkToExpenseInput = { ...bulkToExpenseInput(), expenseDate: null, note: null };
    const withUndefined: BulkToExpenseInput = { ...bulkToExpenseInput(), expenseDate: undefined, note: undefined };
    expect(deriveBulkToExpenseIdempotencyKey(withNulls)).toBe(deriveBulkToExpenseIdempotencyKey(withUndefined));
  });

  test("empty carryover-id list still derives a stable key", () => {
    const empty: BulkToExpenseInput = { ...bulkToExpenseInput(), carryoverIds: [] };
    expect(deriveBulkToExpenseIdempotencyKey(empty)).toBe(deriveBulkToExpenseIdempotencyKey({ ...empty }));
  });

  test("unicode note content is honored verbatim", () => {
    const arabic = deriveBulkToExpenseIdempotencyKey({ ...bulkToExpenseInput(), note: "دفعة مستحقات سبتمبر" });
    const latin = deriveBulkToExpenseIdempotencyKey({ ...bulkToExpenseInput(), note: "September payout" });
    expect(arabic).not.toBe(latin);
  });

  test("changing the actor changes the key", () => {
    expect(deriveBulkToExpenseIdempotencyKey({ ...bulkToExpenseInput(), actorUserId: OPERATOR_B })).not.toBe(
      deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput())
    );
  });
});

describe("deriveCrudIdempotencyKey", () => {
  test("same input produces the same key", () => {
    expect(deriveCrudIdempotencyKey(crudInput())).toBe(deriveCrudIdempotencyKey(crudInput()));
  });

  test("returns a lowercase 64-char hex sha256 digest", () => {
    expect(deriveCrudIdempotencyKey(crudInput())).toMatch(/^[0-9a-f]{64}$/);
  });

  test.each([
    ["teacherId", TEACHER_B],
    ["fromDate", "2026-08-02"],
    ["toDate", "2026-08-30"],
    ["payable", "1250.00"],
    ["clientRequestId", "req-2026-09-05-002"],
  ] as const)("changing %s changes the key", (field, value) => {
    expect(deriveCrudIdempotencyKey({ ...crudInput(), [field]: value })).not.toBe(
      deriveCrudIdempotencyKey(crudInput())
    );
  });

  test("changing the teacher currency changes the key", () => {
    expect(deriveCrudIdempotencyKey({ ...crudInput(), teacherCurrency: CurrencyCode.USD })).not.toBe(
      deriveCrudIdempotencyKey(crudInput())
    );
  });

  test("null and undefined optional dates normalize identically", () => {
    const withNulls: CreateCarryoverInput = { ...crudInput(), fromDate: null, toDate: null };
    const withUndefined: CreateCarryoverInput = { ...crudInput(), fromDate: undefined, toDate: undefined };
    expect(deriveCrudIdempotencyKey(withNulls)).toBe(deriveCrudIdempotencyKey(withUndefined));
  });

  test("unicode client request id is honored verbatim", () => {
    const arabic = deriveCrudIdempotencyKey({ ...crudInput(), clientRequestId: "طلب-٢٠٢٦-٠١" });
    const latin = deriveCrudIdempotencyKey({ ...crudInput(), clientRequestId: "req-2026-01" });
    expect(arabic).not.toBe(latin);
  });

  test("a second operator with the same payload gets a different key", () => {
    expect(deriveCrudIdempotencyKey({ ...crudInput(), actorUserId: OPERATOR_B })).not.toBe(
      deriveCrudIdempotencyKey(crudInput())
    );
  });
});

describe("cross-scope isolation", () => {
  test("bulk-create and crud keys derived from overlapping payloads differ", () => {
    const bulkKey = deriveBulkCreateIdempotencyKey({ instanceIds: [], actorUserId: OPERATOR_A });
    const crudKey = deriveCrudIdempotencyKey({
      teacherId: "",
      payable: "",
      teacherCurrency: CurrencyCode.EGP,
      actorUserId: OPERATOR_A,
    });
    expect(bulkKey).not.toBe(crudKey);
  });
});

describe("bulk client-request-token handling", () => {
  test("bulkCreate: the client token is advisory — tampering with it cannot divert the content-derived key", () => {
    expect(deriveBulkCreateIdempotencyKey({ ...bulkCreateInput(), clientRequestId: "forged-token-42" })).toBe(
      deriveBulkCreateIdempotencyKey(bulkCreateInput())
    );
    expect(deriveBulkCreateIdempotencyKey({ ...bulkCreateInput(), clientRequestId: "another-token" })).toBe(
      deriveBulkCreateIdempotencyKey(bulkCreateInput())
    );
  });

  test("bulkToExpense: the client token stays out of the to-expense key as well", () => {
    expect(deriveBulkToExpenseIdempotencyKey({ ...bulkToExpenseInput(), clientRequestId: "forged-token-42" })).toBe(
      deriveBulkToExpenseIdempotencyKey(bulkToExpenseInput())
    );
  });
});

describe("deriveCrudIdempotencyKey — full payload coverage", () => {
  test.each([
    ["note", "note tampered after submit"],
    ["studentsText", "tampered student roster"],
    ["studentsCount", 7],
  ] as const)("changing %s changes the key", (field, value) => {
    expect(deriveCrudIdempotencyKey({ ...crudInput(), [field]: value })).not.toBe(
      deriveCrudIdempotencyKey(crudInput())
    );
  });

  test("null and undefined free-text fields normalize identically", () => {
    const withNulls: CreateCarryoverInput = {
      ...crudInput(),
      note: null,
      studentsText: null,
      studentsCount: null,
    };
    const withUndefined: CreateCarryoverInput = {
      ...crudInput(),
      note: undefined,
      studentsText: undefined,
      studentsCount: undefined,
    };
    expect(deriveCrudIdempotencyKey(withNulls)).toBe(deriveCrudIdempotencyKey(withUndefined));
  });

  test("unicode notes and RTL student text are hashed verbatim", () => {
    const arabic = deriveCrudIdempotencyKey({
      ...crudInput(),
      note: "دفعة مستحقات سبتمبر",
      studentsText: "سارة، خالد",
    });
    const latin = deriveCrudIdempotencyKey({ ...crudInput(), note: "September payout", studentsText: "Sara, Khaled" });
    expect(arabic).not.toBe(latin);
  });
});
