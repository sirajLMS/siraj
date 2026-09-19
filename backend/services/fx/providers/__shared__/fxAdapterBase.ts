import { logger } from "@/backend/lib/logger";
import type { IFxRateProvider } from "@/backend/services/fx/providers/IFxRateProvider";
import { noFollowRedirectInit, readJsonWithByteBudget } from "@/backend/services/shared";
import type { FxProviderFetchResult } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Common request timeout for FX provider HTTP calls. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Default fetch headers shared by all FX adapters. */
const DEFAULT_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  Accept: "application/json",
});

/**
 * Abstract base class for FX rate provider adapters.
 *
 * Implements the template-method pattern: {@link fetchLatestRates} orchestrates
 * the shared HTTP flow (build URL → fetch with timeout → check status → parse
 * JSON → validate → normalise → return), while subclasses supply
 * provider-specific details via the abstract hooks.
 *
 * Subclasses MUST set the readonly fields {@link name} and {@link apiBase},
 * and implement the abstract methods {@link buildApiUrl}, {@link validateResponse},
 * {@link parseRates}, {@link extractTimestamp}, and {@link validateConfigImpl}.
 */
export abstract class FxAdapterBase implements IFxRateProvider {
  /** Provider enum value — set by subclass. Implements {@link IFxRateProvider.name}. */
  abstract readonly name: FxProviderFetchResult["provider"];

  /**
   * The ISO-4217 base returned by this provider's API (Fixer returns EUR,
   * OER returns USD). Used only in the success log; the normalised result
   * always reports {@link CurrencyCode.USD}.
   */
  protected abstract readonly apiBase: CurrencyCode;

  /**
   * Build the full API URL for the fetch request.
   *
   * Implementations should URL-encode query parameters.
   */
  protected abstract buildApiUrl(): string;

  /**
   * Validate the parsed JSON body provider-specifically.
   *
   * Throw an instance of {@link Error} with a descriptive message when the
   * response indicates a provider error (e.g. Fixer's `success: false` or a
   * missing `rates` object).
   */
  protected abstract validateResponse(parsed: unknown): void;

  /**
   * Extract the raw rates map from the parsed JSON body and normalise
   * those rates into the USD hub (every entry is `USD -> X`, decimal
   * string).
   *
   * Subclasses must ensure the map contains at least an explicit `USD -> USD = 1`
   * entry for consistency.
   */
  protected abstract parseRates(parsed: unknown): Map<CurrencyCode, string>;

  /**
   * Extract the Unix-seconds timestamp from the parsed JSON body and
   * return it as a {@link Date}.
   */
  protected abstract extractTimestamp(parsed: unknown): Date;

  /**
   * Subclass hook for {@link validateConfig} — return true when the adapter's
   * required env vars are present. Performs no network I/O.
   */
  protected abstract validateConfigImpl(): boolean;

  /**
   * Optional extra headers per provider (e.g. data providers that require
   * an `apikey` header). Merged over {@link DEFAULT_HEADERS}.
   */
  protected customFetchHeaders(): Record<string, string> {
    return {};
  }

  /**
   * All {@link CurrencyCode} values — used as the `symbols` query param so
   * each provider returns the full known set of crosses.
   *
   * Subclasses may override to exclude their own base currency (most providers
   * reject base→base as a same-currency pair).
   */
  protected allSymbols(): readonly CurrencyCode[] {
    return Object.values(CurrencyCode);
  }

  /** Convenience: join all symbols with a comma (for `symbols=` query param). */
  protected buildSymbolsParam(): string {
    return this.allSymbols().join(",");
  }

  /**
   * Default implementation of {@link IFxRateProvider.validateConfig}.
   * Delegates to {@link validateConfigImpl} and catches unexpected errors.
   */
  validateConfig(): boolean {
    try {
      return this.validateConfigImpl();
    } catch (error) {
      logger.error("FX adapter configuration validation failed", {
        provider: this.name,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /** Template method implementing {@link IFxRateProvider.fetchLatestRates}. */
  async fetchLatestRates(_locale?: string): Promise<FxProviderFetchResult> {
    const url = this.buildApiUrl();
    const symbolCount = this.allSymbols().length;

    logger.debug("FX adapter fetchLatestRates: requesting", {
      provider: this.name,
      symbolCount,
    });

    const fetchHeaders = Object.assign({}, DEFAULT_HEADERS, this.customFetchHeaders());

    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: fetchHeaders,
      ...noFollowRedirectInit(),
    });

    if (!response.ok) {
      throw new Error(`FX request failed for ${this.name}: HTTP ${response.status} ${response.statusText}`);
    }

    // Bounded read + parse: a hostile or misbehaving provider must not be able
    // to exhaust memory via an oversized body. `unknown` narrows via the Zod
    // schemas inside subclasses (oxlint no-unsafe-type-assertion safety).
    const parsed: unknown = await readJsonWithByteBudget(response);

    this.validateResponse(parsed);

    const rates = this.parseRates(parsed);
    const timestamp = this.extractTimestamp(parsed);

    logger.info("FX adapter fetchLatestRates: succeeded", {
      provider: this.name,
      apiBase: this.apiBase,
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
