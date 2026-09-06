import { describe, expect, test } from "bun:test";
import {
  type CarryoverAggregateInstance,
  computeTotalDurationHours,
  groupInstancesByTeacher,
  maxDate,
  minDate,
  pickDominantCurrency,
  resolveDominantCurrency,
  truncateWithEllipsis,
} from "@/backend/services/teachers";
import { CurrencyCode } from "@/shared/constants/currency.enum";

function buildInstance(overrides: Partial<CarryoverAggregateInstance> = {}): CarryoverAggregateInstance {
  return {
    teacherId: "teacher-1",
    teacherPaidCurrency: CurrencyCode.EGP,
    calculatedDuration: 60,
    scheduledStartAt: new Date("2026-08-10T10:00:00.000Z"),
    ...overrides,
  };
}

function buildCurrencyRow(teacherCurrency: CurrencyCode): { teacherCurrency: CurrencyCode } {
  return { teacherCurrency };
}

describe("groupInstancesByTeacher", () => {
  test("returns an empty map for no instances", () => {
    expect(groupInstancesByTeacher([]).size).toBe(0);
  });

  test("groups instances by teacher preserving first-appearance order", () => {
    const instances = [
      buildInstance({ teacherId: "teacher-b" }),
      buildInstance({ teacherId: "teacher-a" }),
      buildInstance({ teacherId: "teacher-b" }),
    ];
    const groups = groupInstancesByTeacher(instances);
    expect([...groups.keys()]).toEqual(["teacher-b", "teacher-a"]);
    expect(groups.get("teacher-b")).toHaveLength(2);
    expect(groups.get("teacher-a")).toHaveLength(1);
    expect(groups.get("teacher-b")).toEqual([instances[0], instances[2]]);
  });

  test("keeps a single instance in its own bucket", () => {
    const groups = groupInstancesByTeacher([buildInstance({ teacherId: "only" })]);
    expect([...groups.keys()]).toEqual(["only"]);
    expect(groups.get("only")).toHaveLength(1);
  });
});

describe("resolveDominantCurrency", () => {
  test("returns the currency with the most rows", () => {
    const instances = [
      buildInstance({ teacherPaidCurrency: CurrencyCode.SAR }),
      buildInstance({ teacherPaidCurrency: CurrencyCode.EGP }),
      buildInstance({ teacherPaidCurrency: CurrencyCode.EGP }),
    ];
    expect(resolveDominantCurrency(instances, CurrencyCode.SAR)).toBe(CurrencyCode.EGP);
  });

  test("ties resolve to the fallback currency", () => {
    const instances = [
      buildInstance({ teacherPaidCurrency: CurrencyCode.SAR }),
      buildInstance({ teacherPaidCurrency: CurrencyCode.EGP }),
    ];
    expect(resolveDominantCurrency(instances, CurrencyCode.SAR)).toBe(CurrencyCode.SAR);
  });

  test("ties resolve to the fallback even when it appears nowhere in the rows", () => {
    const instances = [
      buildInstance({ teacherPaidCurrency: CurrencyCode.SAR }),
      buildInstance({ teacherPaidCurrency: CurrencyCode.EGP }),
    ];
    expect(resolveDominantCurrency(instances, CurrencyCode.USD)).toBe(CurrencyCode.USD);
  });

  test("ignores instances with no recorded paid currency", () => {
    const instances = [
      buildInstance({ teacherPaidCurrency: null }),
      buildInstance({ teacherPaidCurrency: null }),
      buildInstance({ teacherPaidCurrency: CurrencyCode.EGP }),
    ];
    expect(resolveDominantCurrency(instances, CurrencyCode.SAR)).toBe(CurrencyCode.EGP);
  });

  test("falls back when no instance carries a currency", () => {
    const instances = [buildInstance({ teacherPaidCurrency: null })];
    expect(resolveDominantCurrency(instances, CurrencyCode.SAR)).toBe(CurrencyCode.SAR);
  });

  test("falls back for an empty instance list", () => {
    expect(resolveDominantCurrency([], CurrencyCode.EGP)).toBe(CurrencyCode.EGP);
  });
});

describe("computeTotalDurationHours", () => {
  test("returns 0.00 for an empty list", () => {
    expect(computeTotalDurationHours([])).toBe("0.00");
  });

  test("treats missing durations as zero minutes", () => {
    const instances = [buildInstance({ calculatedDuration: null }), buildInstance({ calculatedDuration: 30 })];
    expect(computeTotalDurationHours(instances)).toBe("0.50");
  });

  test("sums minutes and converts to hours with two decimals", () => {
    const instances = [
      buildInstance({ calculatedDuration: 45 }),
      buildInstance({ calculatedDuration: 90 }),
      buildInstance({ calculatedDuration: 25 }),
    ];
    expect(computeTotalDurationHours(instances)).toBe("2.67");
  });

  test("does not carry binary floating-point noise into the result", () => {
    const instances = [buildInstance({ calculatedDuration: 63 }), buildInstance({ calculatedDuration: 42 })];
    expect(computeTotalDurationHours(instances)).toBe("1.75");
  });

  test("keeps quarter-hour boundaries exact", () => {
    const instances = [buildInstance({ calculatedDuration: 15 })];
    expect(computeTotalDurationHours(instances)).toBe("0.25");
  });

  test("rounds exact decimal halves to the even neighbor (banker's rounding)", () => {
    // 1.5 min = 0.025h -> scaled 2.5 -> 2 is even -> rounds down to 0.02
    expect(computeTotalDurationHours([buildInstance({ calculatedDuration: 1.5 })])).toBe("0.02");
    // 4.5 min = 0.075h -> scaled 7.5 -> 7 is odd -> rounds up to 0.08
    expect(computeTotalDurationHours([buildInstance({ calculatedDuration: 4.5 })])).toBe("0.08");
    // 0.3 min = 0.005h -> scaled 0.5 -> 0 is even -> rounds down to 0.00
    expect(computeTotalDurationHours([buildInstance({ calculatedDuration: 0.3 })])).toBe("0.00");
  });
});

describe("truncateWithEllipsis", () => {
  test("returns short text unchanged", () => {
    expect(truncateWithEllipsis("short text", 500)).toBe("short text");
  });

  test("returns text of exactly maxLen unchanged", () => {
    const text = "a".repeat(500);
    expect(truncateWithEllipsis(text, 500)).toBe(text);
  });

  test("truncates to maxLen-3 characters plus an ellipsis", () => {
    const text = `${"a".repeat(498)}XYZ`;
    const result = truncateWithEllipsis(text, 500);
    expect(result).toBe(`${"a".repeat(497)}…`);
    expect(result).toHaveLength(498);
  });

  test("truncates multibyte text by code-unit length", () => {
    const arabic = "ح".repeat(600);
    const result = truncateWithEllipsis(arabic, 500);
    expect(result).toBe(`${"ح".repeat(497)}…`);
  });

  test("returns an empty string unchanged", () => {
    expect(truncateWithEllipsis("", 500)).toBe("");
  });
});

describe("minDate / maxDate", () => {
  test("returns null for an empty list", () => {
    expect(minDate([])).toBeNull();
    expect(maxDate([])).toBeNull();
  });

  test("ignores null and undefined entries and returns null when nothing remains", () => {
    expect(minDate([null, undefined])).toBeNull();
    expect(maxDate([null, undefined])).toBeNull();
  });

  test("finds the earliest and latest dates from Date instances", () => {
    const dates = [
      new Date("2026-08-05T09:00:00.000Z"),
      new Date("2026-08-01T23:00:00.000Z"),
      new Date("2026-08-12T00:30:00.000Z"),
    ];
    expect(minDate(dates)).toBe("2026-08-01");
    expect(maxDate(dates)).toBe("2026-08-12");
  });

  test("accepts ISO date strings", () => {
    const dates = ["2026-07-31", "2026-09-02"];
    expect(minDate(dates)).toBe("2026-07-31");
    expect(maxDate(dates)).toBe("2026-09-02");
  });

  test("normalizes datetime strings to calendar dates", () => {
    const dates = ["2026-08-10T21:00:00.000Z", "2026-08-11"];
    expect(minDate(dates)).toBe("2026-08-10");
    expect(maxDate(dates)).toBe("2026-08-11");
  });

  test("handles a single value", () => {
    const only = new Date("2026-08-05T00:00:00.000Z");
    expect(minDate([only])).toBe("2026-08-05");
    expect(maxDate([only])).toBe("2026-08-05");
  });
});

describe("pickDominantCurrency", () => {
  test("returns the default currency for an empty page", () => {
    expect(pickDominantCurrency([])).toBe(CurrencyCode.SAR);
  });

  test("returns the single currency of a one-row page", () => {
    expect(pickDominantCurrency([buildCurrencyRow(CurrencyCode.EGP)])).toBe(CurrencyCode.EGP);
  });

  test("returns the currency carried by the most rows", () => {
    const rows = [
      buildCurrencyRow(CurrencyCode.SAR),
      buildCurrencyRow(CurrencyCode.EGP),
      buildCurrencyRow(CurrencyCode.EGP),
      buildCurrencyRow(CurrencyCode.USD),
    ];
    expect(pickDominantCurrency(rows)).toBe(CurrencyCode.EGP);
  });

  test("ties resolve to the currency that reached the leading count first", () => {
    const rows = [
      buildCurrencyRow(CurrencyCode.SAR),
      buildCurrencyRow(CurrencyCode.EGP),
      buildCurrencyRow(CurrencyCode.SAR),
      buildCurrencyRow(CurrencyCode.EGP),
    ];
    expect(pickDominantCurrency(rows)).toBe(CurrencyCode.SAR);
  });
});
