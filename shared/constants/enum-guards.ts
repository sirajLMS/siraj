import { PaymentGateway } from "@/shared/constants/billing.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

const CURRENCY_VALUES = new Set<string>(Object.values(CurrencyCode));
const GATEWAY_VALUES = new Set<string>(Object.values(PaymentGateway));

/**
 * Runtime type-guards for canonical enum strings arriving from GraphQL codegen
 * unions / JSON caches. Narrowing through declared predicates keeps call sites
 * free of unsafe type assertions.
 */
export function isSharedCurrency(value: string): value is CurrencyCode {
  return CURRENCY_VALUES.has(value);
}

/** @see isSharedCurrency */
export function isSharedGateway(value: string): value is PaymentGateway {
  return GATEWAY_VALUES.has(value);
}

/** Falls back to EGP when the raw value is not a known currency. */
export function currencyOf(value: string | null | undefined): CurrencyCode {
  return typeof value === "string" && isSharedCurrency(value) ? value : CurrencyCode.EGP;
}

/** Falls back to NONE when the raw value is not a known gateway. */
export function gatewayOf(value: string | null | undefined): PaymentGateway {
  return typeof value === "string" && isSharedGateway(value) ? value : PaymentGateway.NONE;
}
