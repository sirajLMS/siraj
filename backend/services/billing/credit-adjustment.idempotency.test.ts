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
    const keyA = deriveAdjustmentIdempotencyKey(baseInput());
    const keyB = deriveAdjustmentIdempotencyKey(baseInput());
    expect(keyA).toBe(keyB);
  });

  test("returns a lowercase 64-char hex sha256 digest", () => {
    expect(deriveAdjustmentIdempotencyKey(baseInput())).toMatch(/^[0-9a-f]{64}$/);
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
    expect(deriveAdjustmentIdempotencyKey(reordered)).toBe(deriveAdjustmentIdempotencyKey(baseInput()));
  });
});

describe("deriveAdjustmentIdempotencyKey — field sensitivity", () => {
  test("changing studentId changes the key", () => {
    expect(deriveAdjustmentIdempotencyKey({ ...baseInput(), studentId: STUDENT_B })).not.toBe(
      deriveAdjustmentIdempotencyKey(baseInput())
    );
  });

  test("changing adjustmentType changes the key", () => {
    const carryover = deriveAdjustmentIdempotencyKey(baseInput());
    expect(deriveAdjustmentIdempotencyKey({ ...baseInput(), adjustmentType: CreditAdjustmentType.SUBTRACT })).not.toBe(
      carryover
    );
    expect(deriveAdjustmentIdempotencyKey({ ...baseInput(), adjustmentType: CreditAdjustmentType.ADD })).not.toBe(
      carryover
    );
  });

  test("changing hours changes the key", () => {
    expect(deriveAdjustmentIdempotencyKey({ ...baseInput(), hours: 5 })).not.toBe(
      deriveAdjustmentIdempotencyKey(baseInput())
    );
  });

  test("changing carryover teacher changes the key", () => {
    expect(deriveAdjustmentIdempotencyKey({ ...baseInput(), carryoverTeacherId: TEACHER_B })).not.toBe(
      deriveAdjustmentIdempotencyKey(baseInput())
    );
  });

  test.each([
    ["carryoverFromDate", "2026-08-02"],
    ["carryoverToDate", "2026-08-30"],
    ["carryoverPaymentDate", "2026-09-02"],
  ] as const)("changing %s changes the key", (field, value) => {
    expect(deriveAdjustmentIdempotencyKey({ ...baseInput(), [field]: value })).not.toBe(
      deriveAdjustmentIdempotencyKey(baseInput())
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
    expect(deriveAdjustmentIdempotencyKey(minimal)).toBe(deriveAdjustmentIdempotencyKey(minimal));
  });

  test("null and undefined carryover fields normalize identically", () => {
    const withNulls: CreditAdjustmentIdempotencyInput = {
      ...minimal,
      carryoverTeacherId: null,
      carryoverFromDate: null,
      carryoverToDate: null,
      carryoverPaymentDate: null,
    };
    expect(deriveAdjustmentIdempotencyKey(withNulls)).toBe(deriveAdjustmentIdempotencyKey(minimal));
  });

  test("present carryover fields differ from absent ones", () => {
    expect(deriveAdjustmentIdempotencyKey({ ...minimal, carryoverTeacherId: TEACHER_A })).not.toBe(
      deriveAdjustmentIdempotencyKey(minimal)
    );
    expect(deriveAdjustmentIdempotencyKey({ ...minimal, carryoverFromDate: "2026-08-01" })).not.toBe(
      deriveAdjustmentIdempotencyKey(minimal)
    );
  });
});

describe("deriveAdjustmentIdempotencyKey — edge inputs", () => {
  test("unicode content in hashed fields is honored distinctly", () => {
    const arabicName = deriveAdjustmentIdempotencyKey({ ...baseInput(), carryoverTeacherId: "أحمد المعلم" });
    const latinName = deriveAdjustmentIdempotencyKey({ ...baseInput(), carryoverTeacherId: "احمد المعلم" });
    expect(arabicName).not.toBe(latinName);
  });

  test("date strings are compared verbatim, not normalized", () => {
    const padded = deriveAdjustmentIdempotencyKey({ ...baseInput(), carryoverFromDate: "2026-08-01" });
    const unpadded = deriveAdjustmentIdempotencyKey({ ...baseInput(), carryoverFromDate: "2026-8-1" });
    expect(padded).not.toBe(unpadded);
  });

  test("the free-text reason is excluded from the key", () => {
    const input = baseInput();
    const arabicReasonInput = { ...input, notes: "سبب التعديل: تصحيح رصيد" };
    const htmlReasonInput = { ...input, notes: "<b>Different</b> reason entirely" };
    expect(deriveAdjustmentIdempotencyKey(arabicReasonInput)).toBe(deriveAdjustmentIdempotencyKey(input));
    expect(deriveAdjustmentIdempotencyKey(htmlReasonInput)).toBe(deriveAdjustmentIdempotencyKey(input));
  });

  test("hours boundaries: minimum valid value and fractional hours hash distinctly", () => {
    const keyOne = deriveAdjustmentIdempotencyKey({ ...baseInput(), hours: 1 });
    const keyFraction = deriveAdjustmentIdempotencyKey({ ...baseInput(), hours: 0.5 });
    const keyLarge = deriveAdjustmentIdempotencyKey({ ...baseInput(), hours: 10000 });
    expect(new Set([keyOne, keyFraction, keyLarge]).size).toBe(3);
  });
});

describe("deriveAdjustmentIdempotencyKey — seeded fuzz", () => {
  test("100 seeded random inputs: each derive is stable and all keys are unique", () => {
    const rand = mulberry32(42);
    const keys = new Set<string>();
    for (let index = 0; index < 100; index++) {
      const input = randomFuzzInput(rand, index);
      expect(deriveAdjustmentIdempotencyKey(input)).toBe(deriveAdjustmentIdempotencyKey({ ...input }));
      keys.add(deriveAdjustmentIdempotencyKey(input));
    }
    expect(keys.size).toBe(100);
  });

  test("single-field mutation of seeded inputs always changes the key", () => {
    const rand = mulberry32(7);
    for (let index = 0; index < 25; index++) {
      const input = randomFuzzInput(rand, index);
      const key = deriveAdjustmentIdempotencyKey(input);
      expect(deriveAdjustmentIdempotencyKey({ ...input, studentId: `${input.studentId}-x` })).not.toBe(key);
      expect(deriveAdjustmentIdempotencyKey({ ...input, hours: input.hours + 1 })).not.toBe(key);
      expect(
        deriveAdjustmentIdempotencyKey({
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
