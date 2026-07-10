/**
 * Raw response shape from the Open Exchange Rates /api/latest.json endpoint.
 *
 * Only the fields consumed by the adapter are typed strictly; everything else
 * is left optional because OER may add top-level meta fields (disclaimer,
 * license) without notice.
 */
export interface OpenExchangeRatesResponse {
  disclaimer?: string;
  license?: string;
  /** Unix timestamp (seconds) the_rates snapshot was published. */
  timestamp: number;
  /** ISO 4217 base currency code returned by the provider. */
  base: string;
  /** Provider's base -> X rates keyed by ISO 4217 symbol. */
  rates: Record<string, number>;
}
