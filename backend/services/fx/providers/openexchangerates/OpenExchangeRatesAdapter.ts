import { z } from "zod";
import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { logger } from "@/backend/lib/logger";
import type { IFxRateProvider } from "@/backend/services/fx/providers/IFxRateProvider";
import type { FxProviderFetchResult } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseCurrencyCode } from "@/shared/lib/enum";

const OER_LATEST_ENDPOINT = "https://openexchangerates.org/api/latest.json";
const REQUEST_TIMEOUT_MS = 10_000;

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

export type OpenExchangeRatesResponse = z.infer<typeof openExchangeRatesResponseSchema>;

/**
 * ISO 4217 symbols to request from OER. Excludes the base currency (USD) —
 * OER rejects `symbols=USD` because USD->USD is trivially 1 and would skew
 * the response.
 */
const TARGET_SYMBOLS: readonly CurrencyCode[] = Object.values(CurrencyCode).filter(
  (code): code is CurrencyCode => code !== CurrencyCode.USD
);

function buildSymbolsParam(): string {
  return TARGET_SYMBOLS.join(",");
}

export class OpenExchangeRatesAdapter implements IFxRateProvider {
  readonly name = FxProvider.OpenExchangeRates;

  private readonly appId: string;

  constructor() {
    const appId = process.env.OPENEXCHANGERATES_APP_ID;
    if (!appId) {
      throw new Error("OPENEXCHANGERATES_APP_ID environment variable is required for OpenExchangeRatesAdapter");
    }
    this.appId = appId;
  }

  validateConfig(): boolean {
    try {
      return Boolean(process.env.OPENEXCHANGERATES_APP_ID);
    } catch (error) {
      logger.error("OpenExchangeRates configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async fetchLatestRates(_locale?: string): Promise<FxProviderFetchResult> {
    const symbols = buildSymbolsParam();
    const url =
      `${OER_LATEST_ENDPOINT}?app_id=${encodeURIComponent(this.appId)}` +
      `&base=USD&symbols=${encodeURIComponent(symbols)}`;

    logger.debug("OpenExchangeRates fetchLatestRates: requesting", {
      symbolCount: TARGET_SYMBOLS.length,
    });

    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`OpenExchangeRates request failed: HTTP ${response.status} ${response.statusText}`);
    }

    const raw = await response.json();
    const parsed = openExchangeRatesResponseSchema.parse(raw);

    if (!parsed || typeof parsed.rates !== "object" || parsed.rates == null) {
      throw new Error("OpenExchangeRates response missing rates object");
    }

    const rates = new Map<CurrencyCode, string>();
    for (const [symbol, rate] of Object.entries(parsed.rates)) {
      const code = parseCurrencyCode(symbol);
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

    const timestamp = new Date(parsed.timestamp * 1000);

    logger.info("OpenExchangeRates fetchLatestRates: succeeded", {
      base: parsed.base,
      timestamp: timestamp.toISOString(),
      rateCount: rates.size,
    });

    return {
      provider: this.name,
      base: CurrencyCode.USD,
      timestamp,
      rates,
      rawResponse: parsed,
    };
  }
}
