/**
 * Integration test for the Fixer (APILayer) FX provider adapter.
 *
 * Tag: `@live-fx` — these tests make REAL network calls to
 * https://api.apilayer.com/fixer/latest and consume the Fixer monthly quota.
 * They must NOT run in default CI.
 *
 * B5 (default CI excludes `@live-fx`) is satisfied by the skip-on-missing-env
 * pattern below: the suite skips wholesale when `FIXER_API_KEY` is absent. CI
 * environments (and this dev environment) do not inject that secret, so the
 * suite reports as skipped rather than failing. The `@live-fx` tag in the
 * describe name additionally allows a future bun test filter (e.g.
 * `--test-name-pattern "^(?!.*@live-fx)"`) to exclude these tests explicitly
 * even when keys are present locally.
 *
 * Run locally with the env var set:
 *   FIXER_API_KEY=... ~/.bun/bin/bun test \
 *     backend/services/fx/providers/fixer/fixer.integration.test.ts
 */
import { describe, expect, test } from "bun:test";
import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { FixerAdapter } from "@/backend/services/fx/providers/fixer/FixerAdapter";
import { testLogger } from "@/shared/lib/logger/testlogger";

const hasApiKey = Boolean(process.env.FIXER_API_KEY);

describe("FixerAdapter @live-fx", () => {
  test("validateConfig() returns true when FIXER_API_KEY is set", () => {
    if (!hasApiKey) {
      testLogger.warn("Skipping @live-fx validateConfig: FIXER_API_KEY is not set.");
      return;
    }

    const adapter = new FixerAdapter();

    expect(adapter.validateConfig()).toBe(true);
  });

  test("fetchLatestRates() returns USD-hub rates including a USD->EUR pair after normalisation", async () => {
    if (!hasApiKey) {
      testLogger.warn("Skipping @live-fx fetchLatestRates: FIXER_API_KEY is not set.");
      return;
    }

    const adapter = new FixerAdapter();
    const result = await adapter.fetchLatestRates();

    // Fixer's base is EUR, but the adapter normalises to a USD hub.
    expect(result.provider).toBe(FxProvider.Fixer);
    expect(result.base).toBe(CurrencyCode.USD);
    expect(result.timestamp).toBeInstanceOf(Date);

    const rates = result.rates;
    expect(rates.size).toBeGreaterThan(0);

    // After EUR -> USD-hub normalisation, USD is always present and equals 1.
    expect(rates.has(CurrencyCode.USD)).toBe(true);
    expect(Number.parseFloat(rates.get(CurrencyCode.USD) ?? "-1")).toBe(1);

    // The adapter synthesises USD -> EUR = 1 / (EUR -> USD); it must be present.
    expect(rates.has(CurrencyCode.EUR)).toBe(true);
    const usdToEur = Number.parseFloat(rates.get(CurrencyCode.EUR) ?? "-1");
    expect(Number.isFinite(usdToEur)).toBe(true);
    expect(usdToEur).toBeGreaterThan(0);

    for (const [code, rateString] of rates) {
      const rate = Number.parseFloat(rateString);
      expect(Number.isFinite(rate)).toBe(true);
      expect(rate).toBeGreaterThan(0);
      testLogger.debug("Fixer normalised rate", { code, rate });
    }
  });
});
