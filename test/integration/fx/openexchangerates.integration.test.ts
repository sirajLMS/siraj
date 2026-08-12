/**
 * OpenExchangeRates FX adapter — single live smoke test (one API call).
 * Run: `bun run test:live-fx` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { OpenExchangeRatesAdapter } from "@/backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasAppId = Boolean(process.env.OPENEXCHANGERATES_APP_ID);
const describeLive = describeLiveWhen(hasAppId, "OpenExchangeRatesAdapter @live-fx");

describeLive("OpenExchangeRatesAdapter @live-fx", () => {
  test("fetchLatestRates() returns USD-hub rates from the live OER API", async () => {
    const adapter = new OpenExchangeRatesAdapter();
    expect(adapter.validateConfig()).toBe(true);

    const result = await adapter.fetchLatestRates();

    expect(result.provider).toBe(FxProvider.OpenExchangeRates);
    expect(result.base).toBe(CurrencyCode.USD);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.rates.size).toBeGreaterThan(0);
    expect(result.rates.has(CurrencyCode.USD)).toBe(true);
    expect(Number.parseFloat(result.rates.get(CurrencyCode.USD) ?? "-1")).toBe(1);
  });
});
