import { describe, expect, spyOn, test } from "bun:test";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { logger } from "@/backend/lib/logger";
import { resolveGraceSettings } from "@/backend/services/teacher/payroll-grace-settings";
import type { SystemSettingSelectType } from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

const SHORT_KEY = "payroll.grace_short_minutes";
const LONG_KEY = "payroll.grace_long_minutes";
const THRESHOLD_KEY = "payroll.grace_threshold_minutes";

function graceRow(key: string, value: string): SystemSettingSelectType {
  return {
    key,
    value,
    dataType: SystemSettingDataType.Integer,
    description: "Payroll grace period setting",
    category: SystemSettingCategory.Payroll,
    updatedByUserId: null,
    updatedAt: new Date(0),
  };
}

function mockSettingsRows(valuesByKey: Partial<Record<string, string>>) {
  return spyOn(SystemSettingsRepository, "getByKey").mockImplementation(async key => {
    const value = valuesByKey[key];
    return value === undefined ? null : graceRow(key, value);
  });
}

/**
 * Runs one resolver scenario against mocked setting rows and asserts both the
 * resolved thresholds and whether the misconfiguration warning was emitted.
 */
async function expectGraceResolution(
  valuesByKey: Partial<Record<string, string>>,
  expected: { shortMinutes: number; longMinutes: number; thresholdMinutes: number },
  expectWarning: boolean
): Promise<void> {
  const repoSpy = mockSettingsRows(valuesByKey);
  const warnSpy = spyOn(logger, "warn");

  const result = await resolveGraceSettings();

  expect(result).toEqual(expected);
  if (expectWarning) {
    expect(warnSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(warnSpy).not.toHaveBeenCalled();
  }

  repoSpy.mockRestore();
  warnSpy.mockRestore();
}

/** Deterministic PRNG so sweep failures are reproducible from the seed. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INVALID_GRACE_VALUES = ["-5", "abc", ""] as const;
const INVALID_THRESHOLD_VALUES = ["0", "-7", "xyz", ""] as const;

/**
 * Builds one sweep round: per key a row is either absent (silent default),
 * a random valid integer, or an invalid stored value (misconfiguration).
 */
function buildGraceSweepRound(rand: () => number) {
  const rows: Record<string, string> = {};
  const expected = { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 };
  let misconfigured = false;

  const shortState = rand();
  if (shortState >= 0.4 && shortState < 0.9) {
    const value = Math.floor(rand() * 120);
    rows[SHORT_KEY] = String(value);
    expected.shortMinutes = value;
  } else if (shortState >= 0.9) {
    rows[SHORT_KEY] = INVALID_GRACE_VALUES[Math.floor(rand() * INVALID_GRACE_VALUES.length)];
    misconfigured = true;
  }

  const longState = rand();
  if (longState >= 0.4 && longState < 0.9) {
    const value = Math.floor(rand() * 120);
    rows[LONG_KEY] = String(value);
    expected.longMinutes = value;
  } else if (longState >= 0.9) {
    rows[LONG_KEY] = INVALID_GRACE_VALUES[Math.floor(rand() * INVALID_GRACE_VALUES.length)];
    misconfigured = true;
  }

  const thresholdState = rand();
  if (thresholdState >= 0.4 && thresholdState < 0.9) {
    const value = 1 + Math.floor(rand() * 120);
    rows[THRESHOLD_KEY] = String(value);
    expected.thresholdMinutes = value;
  } else if (thresholdState >= 0.9) {
    rows[THRESHOLD_KEY] = INVALID_THRESHOLD_VALUES[Math.floor(rand() * INVALID_THRESHOLD_VALUES.length)];
    misconfigured = true;
  }

  return { rows, expected, misconfigured };
}

describe("resolveGraceSettings — Tier 1: branches", () => {
  test("returns the configured values when all three settings are present and valid", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "5", [LONG_KEY]: "10", [THRESHOLD_KEY]: "45" },
      { shortMinutes: 5, longMinutes: 10, thresholdMinutes: 45 },
      false
    );
  });

  test("falls back to the defaults when all settings are missing", async () => {
    await expectGraceResolution({}, { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 }, false);
  });

  test("falls back to the defaults with a warning when the short grace is negative", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "-1", [LONG_KEY]: "10", [THRESHOLD_KEY]: "45" },
      { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 },
      true
    );
  });

  test("falls back to the defaults with a warning when the long grace is negative", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "5", [LONG_KEY]: "-2", [THRESHOLD_KEY]: "45" },
      { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 },
      true
    );
  });

  test("falls back to the defaults with a warning when the threshold is below one minute", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "5", [LONG_KEY]: "10", [THRESHOLD_KEY]: "0" },
      { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 },
      true
    );
  });

  test("falls back to the defaults with a warning when a stored value is not an integer", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "abc", [LONG_KEY]: "10", [THRESHOLD_KEY]: "45" },
      { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 },
      true
    );
  });

  test("keeps valid values when only some settings are missing", async () => {
    await expectGraceResolution({ [SHORT_KEY]: "5" }, { shortMinutes: 5, longMinutes: 6, thresholdMinutes: 30 }, false);
  });

  test("reads exactly the three payroll grace setting keys", async () => {
    const repoSpy = mockSettingsRows({
      [SHORT_KEY]: "5",
      [LONG_KEY]: "10",
      [THRESHOLD_KEY]: "45",
    });

    await resolveGraceSettings();

    expect(repoSpy.mock.calls.map(call => call[0])).toEqual([SHORT_KEY, LONG_KEY, THRESHOLD_KEY]);
    repoSpy.mockRestore();
  });

  test("the fallback warning is a structured misconfiguration message", async () => {
    const repoSpy = mockSettingsRows({
      [SHORT_KEY]: "-1",
      [LONG_KEY]: "10",
      [THRESHOLD_KEY]: "45",
    });
    const warnSpy = spyOn(logger, "warn");

    await resolveGraceSettings();

    expect(warnSpy.mock.calls[0]?.[0]).toBe("Payroll grace settings are misconfigured; falling back to defaults");
    repoSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

describe("resolveGraceSettings — Tier 2: boundaries", () => {
  test("zero grace minutes and a one-minute threshold are accepted", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "0", [LONG_KEY]: "0", [THRESHOLD_KEY]: "1" },
      { shortMinutes: 0, longMinutes: 0, thresholdMinutes: 1 },
      false
    );
  });

  test("configured values equal to the defaults still resolve from the settings rows", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "3", [LONG_KEY]: "6", [THRESHOLD_KEY]: "30" },
      { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 },
      false
    );
  });

  test("a negative threshold is rejected just like a zero threshold", async () => {
    await expectGraceResolution(
      { [SHORT_KEY]: "5", [LONG_KEY]: "10", [THRESHOLD_KEY]: "-30" },
      { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 },
      true
    );
  });
});

describe("resolveGraceSettings — Tier 3: seeded combination sweep", () => {
  test("random per-key combinations always resolve to valid thresholds", async () => {
    const rand = mulberry32(0x9e3779b9);
    const rounds = Array.from({ length: 40 }, () => buildGraceSweepRound(rand));

    await rounds.reduce(async (previous, round) => {
      await previous;
      const repoSpy = mockSettingsRows(round.rows);
      const warnSpy = spyOn(logger, "warn");

      const result = await resolveGraceSettings();

      if (round.misconfigured) {
        expect(result).toEqual({ shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 });
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } else {
        expect(result).toEqual(round.expected);
        expect(warnSpy).not.toHaveBeenCalled();
      }
      expect(result.shortMinutes).toBeGreaterThanOrEqual(0);
      expect(result.longMinutes).toBeGreaterThanOrEqual(0);
      expect(result.thresholdMinutes).toBeGreaterThanOrEqual(1);

      repoSpy.mockRestore();
      warnSpy.mockRestore();
    }, Promise.resolve());
  });
});
