import { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import { logger } from "@/backend/lib/logger";
import { FxAdapterBase } from "@/backend/services/fx/providers/__shared__/fxAdapterBase";
import { fixerResponseSchema } from "@/backend/services/fx/providers/fixer/fixer.types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseCurrencyCodeOrNull } from "@/shared/lib/enum";

const FIXER_LATEST_ENDPOINT = "https://api.apilayer.com/fixer/latest";

/**
 * ISO 4217 symbols to request from Fixer. Excludes the base currency (EUR)
 * — Fixer rejects `symbols=EUR` because EUR->EUR is trivially 1. The adapter
 * synthesises EUR->EUR=1 itself during normalisation.
 */
const TARGET_SYMBOLS: readonly CurrencyCode[] = Object.values(CurrencyCode).filter(
  (code): code is CurrencyCode => code !== CurrencyCode.EUR
);

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
function normaliseToUsdHub(eurRates: Record<string, number>): Map<CurrencyCode, string> {
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

    const code = parseCurrencyCodeOrNull(symbol);
    if (!code) {
      continue;
    }

    if (code === CurrencyCode.USD) {
      usdHub.set(CurrencyCode.USD, "1");
      continue;
    }

    // USD->X = EUR->X / EUR->USD. Pass the full-precision float through
    // `String()` rather than truncating to 6 decimals — the `numeric(12,6)`
    // DB column is wide enough to hold the float64 representation exactly
    // for all realistic FX rates, and preserving precision avoids
    // compounding rounding across the USD-hub conversion.
    const usdToX = eurToX / eurToUsd;
    usdHub.set(code, String(usdToX));
  }

  // EUR is excluded from TARGET_SYMBOLS, so Fixer never returns EUR->EUR.
  // Synthesise USD->EUR = 1 / (EUR->USD) so the USD hub covers every code.
  if (!usdHub.has(CurrencyCode.EUR)) {
    usdHub.set(CurrencyCode.EUR, String(1 / eurToUsd));
  }

  return usdHub;
}

/**
 * Fixer (api.apilayer.com) adapter. Fixer's base is EUR — rates are
 * normalised to the USD hub before returning so all providers share a
 * consistent shape.
 */
export class FixerAdapter extends FxAdapterBase {
  readonly name = FxProvider.Fixer;
  protected readonly apiBase = CurrencyCode.EUR;

  private readonly apiKey: string;

  constructor() {
    super();
    const apiKey = process.env.FIXER_API_KEY;
    if (!apiKey) {
      throw new Error("FIXER_API_KEY environment variable is required for FixerAdapter");
    }
    this.apiKey = apiKey;
  }

  protected validateConfigImpl(): boolean {
    return Boolean(process.env.FIXER_API_KEY);
  }

  protected allSymbols(): readonly CurrencyCode[] {
    return TARGET_SYMBOLS;
  }

  protected buildApiUrl(): string {
    const symbols = this.buildSymbolsParam();
    return (
      `${FIXER_LATEST_ENDPOINT}?access_key=${encodeURIComponent(this.apiKey)}` +
      `&base=EUR&symbols=${encodeURIComponent(symbols)}`
    );
  }

  protected customFetchHeaders(): Record<string, string> {
    // apilayer.com requires the access key in the `apikey` header; the
    // legacy data.fixer.io hostname ignores it. Sending both keeps the
    // adapter working against either hostname.
    return { apikey: this.apiKey };
  }

  protected validateResponse(parsed: unknown): void {
    const fixerResponse = fixerResponseSchema.parse(parsed);

    if (!fixerResponse.success) {
      const err = fixerResponse.error;
      const message = err?.info || err?.type || `Fixer error code ${err?.code ?? "unknown"}`;
      throw new Error(`Fixer request unsuccessful: ${message}`);
    }

    if (!fixerResponse.rates || typeof fixerResponse.rates !== "object") {
      throw new Error("Fixer response missing rates object");
    }
  }

  protected parseRates(parsed: unknown): Map<CurrencyCode, string> {
    const fixerResponse = fixerResponseSchema.parse(parsed);
    return normaliseToUsdHub(fixerResponse.rates);
  }

  protected extractTimestamp(parsed: unknown): Date {
    const fixerResponse = fixerResponseSchema.parse(parsed);
    return new Date(fixerResponse.timestamp * 1000);
  }
}
