/**
 * Fixer FX adapter — single live smoke test (one API call).
 * Run: `bun run test:live-fx` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { FixerAdapter } from "@/backend/services/fx/providers/fixer/FixerAdapter";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasApiKey = Boolean(process.env.FIXER_API_KEY);
const describeLive = describeLiveWhen(hasApiKey, "FixerAdapter @live-fx");

describeLive("FixerAdapter @live-fx", () => {
  test("fetchLatestRates() returns USD-hub rates from the live Fixer API", async () => {
    const adapter = new FixerAdapter();
    expect(adapter.validateConfig()).toBe(true);

    const result = await adapter.fetchLatestRates();

    expect(result.provider).toBe(FxProvider.Fixer);
    expect(result.base).toBe(CurrencyCode.USD);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.rates.size).toBeGreaterThan(0);
    expect(result.rates.has(CurrencyCode.USD)).toBe(true);
    expect(Number.parseFloat(result.rates.get(CurrencyCode.USD) ?? "-1")).toBe(1);
  });
});
