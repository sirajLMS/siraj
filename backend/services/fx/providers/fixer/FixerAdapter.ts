import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { CurrencyCode } from "@/backend/enum/shared/currency.enum";
import { logger } from "@/backend/lib/logger";
import { parseCurrencyCode } from "@/backend/lib/enum";
import type { FixerLatestResponse } from "@/backend/services/fx/providers/fixer/fixer.types";
import type { IFxRateProvider } from "@/backend/services/fx/providers/IFxRateProvider";
import type { FxProviderFetchResult } from "@/backend/types";

const FIXER_LATEST_ENDPOINT = "https://api.apilayer.com/fixer/latest";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * ISO 4217 symbols to request from Fixer. Excludes the base currency (EUR)
 * — Fixer rejects `symbols=EUR` because EUR->EUR is trivially 1. The adapter
 * synthesises EUR->EUR=1 itself during normalisation.
 */
const TARGET_SYMBOLS: readonly CurrencyCode[] = Object.values(CurrencyCode).filter(
  (code): code is CurrencyCode => code !== CurrencyCode.EUR
);

function buildSymbolsParam(): string {
  return TARGET_SYMBOLS.join(",");
}

/**
 * Format a number into a decimal string suitable for the `numeric(12,6)`
 * DB column. We pass the full-precision float through `String()` rather
 * than truncating to 6 decimals — the DB column is wide enough to hold the
 * float64 representation exactly for all realistic FX rates, and preserving
 * precision avoids compounding rounding across the USD-hub conversion.
 */
function toRateString(rate: number): string {
  return String(rate);
}

/**
 * Normalise Fixer's EUR-hub rates into a USD-hub map.
 *
 * Math: given any currency X, EUR->X = EUR->USD * USD->X, therefore
 *   USD->X = EUR->X / EUR->USD.
 *
 * Special cases:
 *  - USD->USD is by definition 1.
 *  - USD->EUR = 1 / (EUR->USD).
 *  - For X = EUR (not present in the Fixer symbols), EUR->EUR = 1, so
 *    USD->EUR = 1 / (EUR->USD) — same formula as the USD->EUR entry.
 */
function normaliseToUsdHub(eurRates: Record<string, number>): ReadonlyMap<CurrencyCode, string> {
  const eurToUsd = eurRates[CurrencyCode.USD];
  if (typeof eurToUsd !== "number" || eurToUsd === 0 || Number.isNaN(eurToUsd)) {
    throw new Error("Fixer response missing valid EUR->USD rate required for USD-hub normalisation");
  }

  const usdHub = new Map<CurrencyCode, string>();

  for (const [symbol, eurToX] of Object.entries(eurRates)) {
    if (typeof eurToX !== "number" || Number.isNaN(eurToX)) {
      logger.warn("Fixer returned non-numeric rate for symbol", {
        symbol,
        rate: eurToX,
      });
      continue;
    }

    const code = parseCurrencyCode(symbol);
    if (!code) {
      continue;
    }

    if (code === CurrencyCode.USD) {
      // USD->USD is always 1, regardless of provider numbers.
      usdHub.set(CurrencyCode.USD, "1");
      continue;
    }

    // USD->X = EUR->X / EUR->USD
    const usdToX = eurToX / eurToUsd;
    usdHub.set(code, toRateString(usdToX));
  }

  // EUR is excluded from TARGET_SYMBOLS, so Fixer never returns EUR->EUR.
  // Synthesise USD->EUR = 1 / (EUR->USD) so the USD hub covers every code.
  if (!usdHub.has(CurrencyCode.EUR)) {
    usdHub.set(CurrencyCode.EUR, toRateString(1 / eurToUsd));
  }

  return usdHub;
}

export class FixerAdapter implements IFxRateProvider {
  readonly name = FxProvider.Fixer;

  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.FIXER_API_KEY;
    if (!apiKey) {
      throw new Error("FIXER_API_KEY environment variable is required for FixerAdapter");
    }
    this.apiKey = apiKey;
  }

  validateConfig(): boolean {
    try {
      return Boolean(process.env.FIXER_API_KEY);
    } catch (error) {
      logger.error("Fixer configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async fetchLatestRates(_locale?: string): Promise<FxProviderFetchResult> {
    const symbols = buildSymbolsParam();
    const url =
      `${FIXER_LATEST_ENDPOINT}?access_key=${encodeURIComponent(this.apiKey)}` +
      `&base=EUR&symbols=${encodeURIComponent(symbols)}`;

    logger.debug("Fixer fetchLatestRates: requesting", {
      symbolCount: TARGET_SYMBOLS.length,
    });

    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        // apilayer.com requires the access key in the `apikey` header; the
        // legacy data.fixer.io hostname ignores it. Sending both keeps the
        // adapter working against either hostname.
        apikey: this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Fixer request failed: HTTP ${response.status} ${response.statusText}`);
    }

    const parsed = (await response.json()) as FixerLatestResponse;

    if (!parsed) {
      throw new Error("Fixer response body is empty");
    }

    if (parsed.success === false) {
      const err = parsed.error;
      const message = err?.info || err?.type || `Fixer error code ${err?.code ?? "unknown"}`;
      throw new Error(`Fixer request unsuccessful: ${message}`);
    }

    if (!parsed.rates || typeof parsed.rates !== "object") {
      throw new Error("Fixer response missing rates object");
    }

    const rates = normaliseToUsdHub(parsed.rates);

    const timestamp = new Date(parsed.timestamp * 1000);

    logger.info("Fixer fetchLatestRates: succeeded", {
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
