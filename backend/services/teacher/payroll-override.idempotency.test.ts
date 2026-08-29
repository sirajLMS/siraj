import { describe, expect, test } from "bun:test";
import { CalculationStatus } from "@/backend/enum";
import {
  deriveOverrideIdempotencyKey,
  type PayrollOverrideIdempotencyInput,
} from "@/backend/services/teacher/payroll-override.idempotency";

const INSTANCE_A = "11111111-1111-4111-8111-111111111111";
const INSTANCE_B = "22222222-2222-4222-8222-222222222222";

function baseInput(): PayrollOverrideIdempotencyInput {
  return {
    instanceId: INSTANCE_A,
    targetStatus: CalculationStatus.PARTIALLY,
    partialPercentage: 50,
    note: "Parent disputed half of the session",
    force: false,
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

function randomFuzzInput(rand: () => number, index: number): PayrollOverrideIdempotencyInput {
  const statuses = [
    CalculationStatus.REFUND,
    CalculationStatus.NOT_CALCULATED,
    CalculationStatus.CALCULATED,
    CalculationStatus.PARTIALLY,
  ];
  return {
    instanceId: `instance-${Math.floor(rand() * 1_000_000)}`,
    targetStatus: statuses[Math.floor(rand() * statuses.length)],
    partialPercentage: rand() < 0.3 ? null : Math.floor(rand() * 101),
    note: rand() < 0.3 ? null : `override note ${index}-${Math.floor(rand() * 1000)}`,
    force: rand() < 0.5,
  };
}

describe("deriveOverrideIdempotencyKey — determinism", () => {
  test("same input produces the same key", () => {
    const keyA = deriveOverrideIdempotencyKey(baseInput());
    const keyB = deriveOverrideIdempotencyKey(baseInput());
    expect(keyA).toBe(keyB);
  });

  test("returns a lowercase 64-char hex sha256 digest", () => {
    expect(deriveOverrideIdempotencyKey(baseInput())).toMatch(/^[0-9a-f]{64}$/);
  });

  test("is stable across object identity and key insertion order", () => {
    const { force, note, partialPercentage, ...head } = baseInput();
    const reordered: PayrollOverrideIdempotencyInput = {
      ...head,
      force,
      note,
      partialPercentage,
    };
    expect(deriveOverrideIdempotencyKey(reordered)).toBe(deriveOverrideIdempotencyKey(baseInput()));
  });
});

describe("deriveOverrideIdempotencyKey — field sensitivity", () => {
  test("changing instanceId changes the key", () => {
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), instanceId: INSTANCE_B })).not.toBe(
      deriveOverrideIdempotencyKey(baseInput())
    );
  });

  test("changing targetStatus changes the key", () => {
    const baseline = deriveOverrideIdempotencyKey(baseInput());
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), targetStatus: CalculationStatus.REFUND })).not.toBe(baseline);
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), targetStatus: CalculationStatus.NOT_CALCULATED })).not.toBe(
      baseline
    );
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), targetStatus: CalculationStatus.CALCULATED })).not.toBe(
      baseline
    );
  });

  test("changing partialPercentage changes the key", () => {
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), partialPercentage: 75 })).not.toBe(
      deriveOverrideIdempotencyKey(baseInput())
    );
  });

  test("changing note changes the key", () => {
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), note: "Full refund agreed with parent" })).not.toBe(
      deriveOverrideIdempotencyKey(baseInput())
    );
  });

  test("toggling force changes the key", () => {
    expect(deriveOverrideIdempotencyKey({ ...baseInput(), force: true })).not.toBe(
      deriveOverrideIdempotencyKey(baseInput())
    );
  });
});

describe("deriveOverrideIdempotencyKey — optional-field boundaries", () => {
  const minimal: PayrollOverrideIdempotencyInput = {
    instanceId: INSTANCE_A,
    targetStatus: CalculationStatus.REFUND,
  };

  test("null and undefined partialPercentage normalize identically", () => {
    expect(deriveOverrideIdempotencyKey({ ...minimal, partialPercentage: null })).toBe(
      deriveOverrideIdempotencyKey(minimal)
    );
  });

  test("null, undefined, and empty-string notes normalize identically", () => {
    expect(deriveOverrideIdempotencyKey({ ...minimal, note: null })).toBe(deriveOverrideIdempotencyKey(minimal));
    expect(deriveOverrideIdempotencyKey({ ...minimal, note: "" })).toBe(deriveOverrideIdempotencyKey(minimal));
  });

  test("percentage 0 is distinct from an absent percentage", () => {
    expect(deriveOverrideIdempotencyKey({ ...minimal, partialPercentage: 0 })).not.toBe(
      deriveOverrideIdempotencyKey(minimal)
    );
  });

  test("percentage boundaries 0 and 100 hash distinctly from each other and the midpoint", () => {
    const keyZero = deriveOverrideIdempotencyKey({ ...baseInput(), partialPercentage: 0 });
    const keyFull = deriveOverrideIdempotencyKey({ ...baseInput(), partialPercentage: 100 });
    const keyHalf = deriveOverrideIdempotencyKey(baseInput());
    expect(new Set([keyZero, keyFull, keyHalf]).size).toBe(3);
  });

  test("force true is distinct from absent and explicit false, which agree", () => {
    const keyTrue = deriveOverrideIdempotencyKey({ ...minimal, force: true });
    expect(keyTrue).not.toBe(deriveOverrideIdempotencyKey(minimal));
    expect(keyTrue).not.toBe(deriveOverrideIdempotencyKey({ ...minimal, force: false }));
    expect(deriveOverrideIdempotencyKey({ ...minimal, force: false })).toBe(deriveOverrideIdempotencyKey(minimal));
  });
});

describe("deriveOverrideIdempotencyKey — edge inputs", () => {
  test("unicode and emoji notes hash distinctly from latin equivalents", () => {
    const arabic = deriveOverrideIdempotencyKey({
      ...baseInput(),
      note: "خصم نصف الحصة: خلاف مع ولي الأمر",
    });
    const latin = deriveOverrideIdempotencyKey({
      ...baseInput(),
      note: "Half session deducted: parent dispute",
    });
    const emoji = deriveOverrideIdempotencyKey({
      ...baseInput(),
      note: "⚠️ خصم ٥٠٪ — تم التوافق 🤝",
    });
    expect(new Set([arabic, latin, emoji]).size).toBe(3);
  });

  test("very long notes still hash stably and distinctly from their prefix", () => {
    const longNote = "disputed session ".repeat(200);
    const keyLong = deriveOverrideIdempotencyKey({ ...baseInput(), note: longNote });
    expect(keyLong).toMatch(/^[0-9a-f]{64}$/);
    expect(keyLong).toBe(deriveOverrideIdempotencyKey({ ...baseInput(), note: longNote }));
    expect(keyLong).not.toBe(deriveOverrideIdempotencyKey({ ...baseInput(), note: longNote.slice(0, 100) }));
  });

  test("a colon-bearing note cannot impersonate a different force flag", () => {
    const embedded = deriveOverrideIdempotencyKey({ ...baseInput(), note: "approved:true", force: false });
    const genuine = deriveOverrideIdempotencyKey({ ...baseInput(), note: "approved", force: true });
    expect(embedded).not.toBe(genuine);
  });

  test("client-generated request ids and actor ids do not affect the key", () => {
    const first = { ...baseInput(), clientRequestId: "override-dialog-click-1", actorUserId: "actor-a" };
    const second = { ...baseInput(), clientRequestId: "override-dialog-click-2", actorUserId: "actor-b" };
    expect(deriveOverrideIdempotencyKey(first)).toBe(deriveOverrideIdempotencyKey(second));
  });
});

describe("deriveOverrideIdempotencyKey — seeded fuzz", () => {
  test("100 seeded random inputs: each derive is stable and all keys are unique", () => {
    const rand = mulberry32(42);
    const keys = new Set<string>();
    for (let index = 0; index < 100; index++) {
      const input = randomFuzzInput(rand, index);
      expect(deriveOverrideIdempotencyKey(input)).toBe(deriveOverrideIdempotencyKey({ ...input }));
      keys.add(deriveOverrideIdempotencyKey(input));
    }
    expect(keys.size).toBe(100);
  });

  test("single-field mutation of seeded inputs always changes the key", () => {
    const rand = mulberry32(7);
    for (let index = 0; index < 25; index++) {
      const input = randomFuzzInput(rand, index);
      const key = deriveOverrideIdempotencyKey(input);
      expect(deriveOverrideIdempotencyKey({ ...input, instanceId: `${input.instanceId}-x` })).not.toBe(key);
      expect(
        deriveOverrideIdempotencyKey({
          ...input,
          targetStatus:
            input.targetStatus === CalculationStatus.REFUND ? CalculationStatus.CALCULATED : CalculationStatus.REFUND,
        })
      ).not.toBe(key);
      expect(deriveOverrideIdempotencyKey({ ...input, note: `${input.note ?? ""}x` })).not.toBe(key);
      expect(deriveOverrideIdempotencyKey({ ...input, force: !input.force })).not.toBe(key);
      expect(
        deriveOverrideIdempotencyKey({
          ...input,
          partialPercentage: input.partialPercentage == null ? 0 : input.partialPercentage + 1,
        })
      ).not.toBe(key);
    }
  });
});
