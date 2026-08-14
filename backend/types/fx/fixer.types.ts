/**
 * Raw response shape from the Fixer /latest endpoint (api.apilayer.com).
 *
 * Fixer's base currency is EUR. The adapter normalises these EUR-based rates
 * into USD-hub rates before returning, so consumers always see USD -> X.
 */
export interface FixerLatestResponse {
  /** Fixer's success flag — false indicates an error payload. */
  success: boolean;
  /** Unix timestamp (seconds) the snapshot was published. */
  timestamp: number;
  /** ISO 4217 base currency returned by the provider. */
  base: string;
  /** ISO 8601 date string for the snapshot. */
  date: string;
  /** Provider's base -> X rates keyed by ISO 4217 symbol. */
  rates: Record<string, number>;
  /** Populated when `success` is false. */
  error?: {
    code: number;
    type: string;
    info?: string;
  };
}
