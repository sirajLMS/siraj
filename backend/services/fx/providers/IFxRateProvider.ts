import type { FxProvider } from "@/backend/enum/fx/fx-provider.enum";
import type { FxProviderFetchResult } from "@/backend/types";

/**
 * Contract for a pluggable FX rate provider adapter.
 *
 * Adapters are stateless HTTP clients: there is no `disconnect` lifecycle
 * hook because every call opens a new request.
 */
export interface IFxRateProvider {
  /** The provider this adapter implements. */
  readonly name: FxProvider;

  /**
   * Fetch the latest exchange rates from the provider.
   *
   * The returned {@link FxProviderFetchResult} is always normalised to a
   * USD hub: every entry in `rates` is a USD -> X conversion expressed as a
   * decimal string ready for the `numeric(12,6)` DB column.
   *
   * @param locale Optional locale for localised provider error messages.
   */
  fetchLatestRates(locale?: string): Promise<FxProviderFetchResult>;

  /**
   * Lightweight pre-flight check that returns true when the env vars this
   * adapter depends on are configured. Performs no network I/O.
   */
  validateConfig(): boolean;
}
