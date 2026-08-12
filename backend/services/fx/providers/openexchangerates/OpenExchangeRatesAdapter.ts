import { z } from "zod";
import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { logger } from "@/backend/lib/logger";
import { FxAdapterBase } from "@/backend/services/fx/providers/__shared__/fxAdapterBase";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseCurrencyCodeOrNull } from "@/shared/lib/enum";

const OER_LATEST_ENDPOINT = "https://openexchangerates.org/api/latest.json";

/**
 * Zod schema for validating OpenExchangeRatesResponse at runtime.
 * Used to safely parse the API response instead of unsafe type assertions.
 */
const openExchangeRatesResponseSchema = z.object({
  disclaimer: z.string().optional(),
  license: z.string().optional(),
  timestamp: z.number(),
  base: z.string(),
  rates: z.record(z.string(), z.number()),
});

/**
 * ISO 4217 symbols to request from OER. Excludes the base currency (USD) —
 * OER rejects `symbols=USD` because USD->USD is trivially 1 and would skew
 * the response.
 */
const TARGET_SYMBOLS: readonly CurrencyCode[] = Object.values(CurrencyCode).filter(
  (code): code is CurrencyCode => code !== CurrencyCode.USD
);

/**
 * OpenExchangeRates adapter. OER's base is USD, so rates are already in the
 * USD hub — no normalisation needed beyond filtering non-numeric entries
 * and ensuring the `USD -> USD = 1` entry is present.
 */
export class OpenExchangeRatesAdapter extends FxAdapterBase {
  readonly name = FxProvider.OpenExchangeRates;
  protected readonly apiBase = CurrencyCode.USD;

  private readonly appId: string;

  constructor() {
    super();
    const appId = process.env.OPENEXCHANGERATES_APP_ID;
    if (!appId) {
      throw new Error("OPENEXCHANGERATES_APP_ID environment variable is required for OpenExchangeRatesAdapter");
    }
    this.appId = appId;
  }

  protected validateConfigImpl(): boolean {
    return Boolean(process.env.OPENEXCHANGERATES_APP_ID);
  }

  protected allSymbols(): readonly CurrencyCode[] {
    return TARGET_SYMBOLS;
  }

  protected buildApiUrl(): string {
    const symbols = this.buildSymbolsParam();
    return (
      `${OER_LATEST_ENDPOINT}?app_id=${encodeURIComponent(this.appId)}` +
      `&base=USD&symbols=${encodeURIComponent(symbols)}`
    );
  }

  protected validateResponse(parsed: unknown): void {
    const oerResponse = openExchangeRatesResponseSchema.parse(parsed);

    if (!oerResponse || typeof oerResponse.rates !== "object" || oerResponse.rates == null) {
      throw new Error("OpenExchangeRates response missing rates object");
    }
  }

  protected parseRates(parsed: unknown): Map<CurrencyCode, string> {
    const oerResponse = openExchangeRatesResponseSchema.parse(parsed);

    const rates = new Map<CurrencyCode, string>();
    for (const [symbol, rate] of Object.entries(oerResponse.rates)) {
      const code = parseCurrencyCodeOrNull(symbol);
      if (!code) {
        continue;
      }
      if (code === CurrencyCode.USD) {
        continue;
      }
      if (typeof rate !== "number" || Number.isNaN(rate)) {
        logger.warn("OpenExchangeRates returned non-numeric rate for symbol", {
          symbol,
          rate,
        });
        continue;
      }
      rates.set(code, String(rate));
    }

    // OER base is USD, so USD->USD is implicitly 1.
    rates.set(CurrencyCode.USD, "1");

    return rates;
  }

  protected extractTimestamp(parsed: unknown): Date {
    const oerResponse = openExchangeRatesResponseSchema.parse(parsed);
    return new Date(oerResponse.timestamp * 1000);
  }
}
