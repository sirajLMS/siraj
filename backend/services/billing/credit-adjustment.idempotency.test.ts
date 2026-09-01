import { describe, expect, test } from "bun:test";
import { CreditAdjustmentType } from "@/backend/enum";
import {
  type CreditAdjustmentIdempotencyInput,
  deriveAdjustmentIdempotencyKey,
} from "@/backend/services/billing/credit-adjustment.idempotency";

const STUDENT_A = "11111111-1111-4111-8111-111111111111";
const STUDENT_B = "22222222-2222-4222-8222-222222222222";
const TEACHER_A = "33333333-3333-4333-8333-333333333333";
const TEACHER_B = "44444444-4444-4444-8444-444444444444";
const OPERATOR_A = "55555555-5555-4555-8555-555555555555";
const OPERATOR_B = "66666666-6666-4666-8666-666666666666";

function baseInput(): CreditAdjustmentIdempotencyInput {
  return {
    studentId: STUDENT_A,
    adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
    hours: 4,
    carryoverTeacherId: TEACHER_A,
    carryoverFromDate: "2026-08-01",
    carryoverToDate: "2026-08-31",
    carryoverPaymentDate: "2026-09-01",
  };
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function randomFuzzInput(rand: () => number, index: number): CreditAdjustmentIdempotencyInput {
  const types = [CreditAdjustmentType.ADD, CreditAdjustmentType.SUBTRACT, CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER];
  return {
    studentId: `student-${Math.floor(rand() * 1_000_000)}`,
    adjustmentType: types[Math.floor(rand() * types.length)],
    hours: 1 + Math.floor(rand() * 500),
    carryoverTeacherId: rand() < 0.5 ? undefined : `teacher-${Math.floor(rand() * 1_000_000)}`,
    carryoverFromDate: `2026-0${1 + (index % 9)}-0${1 + Math.floor(rand() * 9)}`,
    carryoverToDate: `2026-1${index % 3}-1${Math.floor(rand() * 9)}`,
    carryoverPaymentDate: index % 2 === 0 ? null : `2027-01-0${1 + (index % 9)}`,
  };
}

describe("deriveAdjustmentIdempotencyKey — determinism", () => {
  test("same input produces the same key", () => {
    const keyA = deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput());
    const keyB = deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput());
    expect(keyA).toBe(keyB);
  });

  test("returns a lowercase 64-char hex sha256 digest", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())).toMatch(/^[0-9a-f]{64}$/);
  });

  test("is stable across object identity and key insertion order", () => {
    const { carryoverPaymentDate, carryoverToDate, carryoverFromDate, carryoverTeacherId, ...head } = baseInput();
    const reordered: CreditAdjustmentIdempotencyInput = {
      ...head,
      carryoverPaymentDate,
      carryoverToDate,
      carryoverFromDate,
      carryoverTeacherId,
    };
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, reordered)).toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())
    );
  });
});

describe("deriveAdjustmentIdempotencyKey — field sensitivity", () => {
  test("changing studentId changes the key", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), studentId: STUDENT_B })).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())
    );
  });

  test("changing adjustmentType changes the key", () => {
    const carryover = deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput());
    expect(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), adjustmentType: CreditAdjustmentType.SUBTRACT })
    ).not.toBe(carryover);
    expect(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), adjustmentType: CreditAdjustmentType.ADD })
    ).not.toBe(carryover);
  });

  test("changing hours changes the key", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), hours: 5 })).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())
    );
  });

  test("changing carryover teacher changes the key", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), carryoverTeacherId: TEACHER_B })).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())
    );
  });

  test.each([
    ["carryoverFromDate", "2026-08-02"],
    ["carryoverToDate", "2026-08-30"],
    ["carryoverPaymentDate", "2026-09-02"],
  ] as const)("changing %s changes the key", (field, value) => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), [field]: value })).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())
    );
  });
});

describe("deriveAdjustmentIdempotencyKey — actor sensitivity", () => {
  test("two distinct operators hashing the same payload get distinct keys", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_B, baseInput())).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, baseInput())
    );
  });

  test("the same operator re-submitting an unchanged payload re-derives the same key", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_B, baseInput())).toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_B, { ...baseInput() })
    );
  });
});

describe("deriveAdjustmentIdempotencyKey — optional carryover fields", () => {
  const minimal: CreditAdjustmentIdempotencyInput = {
    studentId: STUDENT_A,
    adjustmentType: CreditAdjustmentType.ADD,
    hours: 1,
  };

  test("undefined carryover fields produce a stable key", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, minimal)).toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, minimal)
    );
  });

  test("null and undefined carryover fields normalize identically", () => {
    const withNulls: CreditAdjustmentIdempotencyInput = {
      ...minimal,
      carryoverTeacherId: null,
      carryoverFromDate: null,
      carryoverToDate: null,
      carryoverPaymentDate: null,
    };
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, withNulls)).toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, minimal)
    );
  });

  test("present carryover fields differ from absent ones", () => {
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...minimal, carryoverTeacherId: TEACHER_A })).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, minimal)
    );
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...minimal, carryoverFromDate: "2026-08-01" })).not.toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, minimal)
    );
  });
});

describe("deriveAdjustmentIdempotencyKey — edge inputs", () => {
  test("unicode content in hashed fields is honored distinctly", () => {
    const arabicName = deriveAdjustmentIdempotencyKey(OPERATOR_A, {
      ...baseInput(),
      carryoverTeacherId: "أحمد المعلم",
    });
    const latinName = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), carryoverTeacherId: "احمد المعلم" });
    expect(arabicName).not.toBe(latinName);
  });

  test("date strings are compared verbatim, not normalized", () => {
    const padded = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), carryoverFromDate: "2026-08-01" });
    const unpadded = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), carryoverFromDate: "2026-8-1" });
    expect(padded).not.toBe(unpadded);
  });

  test("key material is hashed verbatim — whitespace and casing variants produce distinct keys", () => {
    const letterBearingId = "550e8400-e29b-41d4-a716-446655440000";
    const lower = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), carryoverTeacherId: letterBearingId });
    const upper = deriveAdjustmentIdempotencyKey(OPERATOR_A, {
      ...baseInput(),
      carryoverTeacherId: letterBearingId.toUpperCase(),
    });
    const padded = deriveAdjustmentIdempotencyKey(OPERATOR_A, {
      ...baseInput(),
      carryoverTeacherId: ` ${letterBearingId} `,
    });
    expect(new Set([lower, upper, padded]).size).toBe(3);
  });

  test("the free-text reason is excluded from the key", () => {
    const input = baseInput();
    const arabicReasonInput = { ...input, notes: "سبب التعديل: تصحيح رصيد" };
    const htmlReasonInput = { ...input, notes: "<b>Different</b> reason entirely" };
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, arabicReasonInput)).toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, input)
    );
    expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, htmlReasonInput)).toBe(
      deriveAdjustmentIdempotencyKey(OPERATOR_A, input)
    );
  });

  test("hours boundaries: minimum valid value and fractional hours hash distinctly", () => {
    const keyOne = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), hours: 1 });
    const keyFraction = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), hours: 0.5 });
    const keyLarge = deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...baseInput(), hours: 10000 });
    expect(new Set([keyOne, keyFraction, keyLarge]).size).toBe(3);
  });
});

describe("deriveAdjustmentIdempotencyKey — seeded fuzz", () => {
  test("100 seeded random inputs: each derive is stable and all keys are unique", () => {
    const rand = mulberry32(42);
    const keys = new Set<string>();
    for (let index = 0; index < 100; index++) {
      const input = randomFuzzInput(rand, index);
      expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, input)).toBe(
        deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...input })
      );
      keys.add(deriveAdjustmentIdempotencyKey(OPERATOR_A, input));
    }
    expect(keys.size).toBe(100);
  });

  test("single-field mutation of seeded inputs always changes the key", () => {
    const rand = mulberry32(7);
    for (let index = 0; index < 25; index++) {
      const input = randomFuzzInput(rand, index);
      const key = deriveAdjustmentIdempotencyKey(OPERATOR_A, input);
      expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...input, studentId: `${input.studentId}-x` })).not.toBe(key);
      expect(deriveAdjustmentIdempotencyKey(OPERATOR_A, { ...input, hours: input.hours + 1 })).not.toBe(key);
      expect(
        deriveAdjustmentIdempotencyKey(OPERATOR_A, {
          ...input,
          adjustmentType:
            input.adjustmentType === CreditAdjustmentType.ADD
              ? CreditAdjustmentType.SUBTRACT
              : CreditAdjustmentType.ADD,
        })
      ).not.toBe(key);
    }
  });
});
