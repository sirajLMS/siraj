/**
 * Integration test for the OpenExchangeRates FX provider adapter.
 *
 * Tag: `@live-fx` — these tests make REAL network calls to
 * https://openexchangerates.org/api/latest.json and consume the provider
 * monthly quota. They must NOT run in default CI.
 *
 * B5 (default CI excludes `@live-fx`) is satisfied by `describe.skip` when
 * `OPENEXCHANGERATES_APP_ID` is absent. CI environments do not inject that
 * secret, so the suite reports as skipped rather than failing. For a real
 * live run locally, use `bun run test:live-fx` (requires keys in `.env`).
 */
import { describe, expect, test } from "bun:test";
import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { OpenExchangeRatesAdapter } from "@/backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter";
import { testLogger } from "@/shared/lib/logger/testlogger";

const hasAppId = Boolean(process.env.OPENEXCHANGERATES_APP_ID);
const describeLive = hasAppId ? describe : describe.skip;

describeLive("OpenExchangeRatesAdapter @live-fx", () => {
  test("validateConfig() returns true when OPENEXCHANGERATES_APP_ID is set", () => {
    const adapter = new OpenExchangeRatesAdapter();

    expect(adapter.validateConfig()).toBe(true);
  });

  test("fetchLatestRates() returns a USD-hub rates Map with USD and common currencies", async () => {
    const adapter = new OpenExchangeRatesAdapter();
    const result = await adapter.fetchLatestRates();

    expect(result.provider).toBe(FxProvider.OpenExchangeRates);
    expect(result.base).toBe(CurrencyCode.USD);
    expect(result.timestamp).toBeInstanceOf(Date);

    const rates = result.rates;
    expect(rates.size).toBeGreaterThan(0);
    expect(rates.has(CurrencyCode.USD)).toBe(true);
    // Common currencies that OER always returns.
    expect(rates.has(CurrencyCode.EUR)).toBe(true);
    expect(rates.has(CurrencyCode.EGP)).toBe(true);

    for (const [code, rateString] of rates) {
      const rate = Number.parseFloat(rateString);
      expect(Number.isFinite(rate)).toBe(true);
      expect(rate).toBeGreaterThan(0);
      testLogger.debug("OER rate", { code, rate });
    }

    // USD -> USD is by definition 1.
    expect(Number.parseFloat(rates.get(CurrencyCode.USD) ?? "-1")).toBe(1);
  });
});
