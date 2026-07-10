/**
 * Pure option-building helpers for payment-method UI components.
 *
 * Mirrors the API surface of `frontend/lib/currency.ts`, but where the
 * currency catalog relies on the runtime `Intl.DisplayNames` API, the
 * payment-method catalog uses `next-intl` translation keys (there is no
 * `Intl.DisplayNames` equivalent for custom enum strings). Components pass
 * the relevant `t` function in; this file stays free of any React/next-intl
 * imports so it can be unit-tested and tree-shaken.
 *
 * Phase 1 uses LOCALLY defined string-literal unions (Option A) because the
 * GraphQL codegen has not yet been re-run (Phase 5). When Phase 5 lands and
 * the codegen emits the matching GraphQL enum types, these local unions can
 * be replaced with re-exports from `@/frontend/graphql/generated/gql/graphql-types`
 * — the string values are intentionally identical so the swap is type-safe.
 *
 * Backend imports (`@/backend/enum`, `@/backend/types`) are FORBIDDEN in the
 * frontend per AGENTS.md; the unions below are the canonical frontend copy.
 */

import type { LocalizedString } from "@/shared/types/localized-string";

// ---------------------------------------------------------------------------
// Local enum unions (Phase 1 stopgap — replace with codegen re-exports in P5)
// ---------------------------------------------------------------------------

export type PaymentMethodType = "MOBILE_WALLET" | "PAYMENT_LINK" | "ONLINE_ACCOUNT" | "BANK_TRANSFER" | "CASH";

export type PaymentDirection = "PAYIN" | "PAYOUT" | "BOTH";

export type IdentifierKind = "EMAIL" | "HANDLE" | "EMAIL_OR_HANDLE";

export const PAYMENT_METHOD_TYPES: readonly PaymentMethodType[] = [
  "MOBILE_WALLET",
  "PAYMENT_LINK",
  "ONLINE_ACCOUNT",
  "BANK_TRANSFER",
  "CASH",
];

export const PAYMENT_DIRECTIONS: readonly PaymentDirection[] = ["PAYIN", "PAYOUT", "BOTH"];

export const IDENTIFIER_KINDS: readonly IdentifierKind[] = ["EMAIL", "HANDLE", "EMAIL_OR_HANDLE"];

// ---------------------------------------------------------------------------
// Translation-key maps
//
// Ordering intentionally mirrors the `PAYMENT_*` const arrays so the picker's
// preferred entries stay at the top — matches the "stable order" convention
// used by `getCurrencyOptions` in `frontend/lib/currency.ts`.
// ---------------------------------------------------------------------------

const PAYMENT_METHOD_TYPE_LABEL_KEYS: Record<PaymentMethodType, string> = {
  MOBILE_WALLET: "ui.paymentMethod.type.mobileWallet",
  PAYMENT_LINK: "ui.paymentMethod.type.paymentLink",
  ONLINE_ACCOUNT: "ui.paymentMethod.type.onlineAccount",
  BANK_TRANSFER: "ui.paymentMethod.type.bankTransfer",
  CASH: "ui.paymentMethod.type.cash",
};

const PAYMENT_DIRECTION_LABEL_KEYS: Record<PaymentDirection, string> = {
  PAYIN: "ui.paymentMethod.direction.in",
  PAYOUT: "ui.paymentMethod.direction.out",
  BOTH: "ui.paymentMethod.direction.both",
};

export const IDENTIFIER_KIND_LABEL_KEYS: Record<IdentifierKind, string> = {
  EMAIL: "ui.paymentMethod.identifier.email",
  HANDLE: "ui.paymentMethod.identifier.handle",
  EMAIL_OR_HANDLE: "ui.paymentMethod.identifier.emailOrHandle",
};

// ---------------------------------------------------------------------------
// Translation-function shapes
//
// Accepting a structural `(key: string) => string` keeps this file decoupled
// from `next-intl`'s `Translations` tuple types — callers simply pass the
// root `t` from `useTranslations()`, or `t.raw(...)` when the keys live
// outside the configured namespace. See `PaymentMethodTypeSelector` and
// `PaymentMethodSelect` (Phase 7) for concrete call-sites.
// ---------------------------------------------------------------------------

export type PaymentMethodLabelResolver = (messageKey: string) => string;

export interface PaymentMethodTypeLabels {
  readonly mobileWallet: string;
  readonly paymentLink: string;
  readonly onlineAccount: string;
  readonly bankTransfer: string;
  readonly cash: string;
}

export interface PaymentDirectionLabels {
  readonly in: string;
  readonly out: string;
  readonly both: string;
}

export interface IdentifierKindLabels {
  readonly email: string;
  readonly handle: string;
  readonly emailOrHandle: string;
}

// ---------------------------------------------------------------------------
// Single-value label resolvers (mirror `getCurrencyDisplayName`)
// ---------------------------------------------------------------------------

/** Resolve the localized display name for a single payment-method type. */
export function getPaymentMethodTypeLabel(type: PaymentMethodType, t: PaymentMethodLabelResolver): string {
  return t(PAYMENT_METHOD_TYPE_LABEL_KEYS[type]);
}

/** Resolve the localized display name for a single direction ("In"/"Out"/"Both"). */
export function getPaymentMethodDirectionLabel(direction: PaymentDirection, t: PaymentMethodLabelResolver): string {
  return t(PAYMENT_DIRECTION_LABEL_KEYS[direction]);
}

/** Resolve the localized label for a single identifier kind. */
export function getIdentifierKindLabel(kind: IdentifierKind, t: PaymentMethodLabelResolver): string {
  return t(IDENTIFIER_KIND_LABEL_KEYS[kind]);
}

// ---------------------------------------------------------------------------
// Label-bundle resolvers
//
// Returned objects match the `PaymentMethodTypeLabels` / `PaymentDirectionLabels`
// interfaces exported above so components can hand the entire bundle straight
// to `next-intl`'s `useTranslations().formatBundle(...)` or destructure inline.
// Mirrors the "all keys for one component" promise of the
// `CurrencySelectLabels` interface in `shared/messages/types/ui/currency-select`.
// ---------------------------------------------------------------------------

/** Resolve all payment-method-type labels at once (one pass over `t`). */
export function getPaymentMethodTypeLabels(t: PaymentMethodLabelResolver): PaymentMethodTypeLabels {
  return {
    mobileWallet: t(PAYMENT_METHOD_TYPE_LABEL_KEYS.MOBILE_WALLET),
    paymentLink: t(PAYMENT_METHOD_TYPE_LABEL_KEYS.PAYMENT_LINK),
    onlineAccount: t(PAYMENT_METHOD_TYPE_LABEL_KEYS.ONLINE_ACCOUNT),
    bankTransfer: t(PAYMENT_METHOD_TYPE_LABEL_KEYS.BANK_TRANSFER),
    cash: t(PAYMENT_METHOD_TYPE_LABEL_KEYS.CASH),
  };
}

/** Resolve all direction labels at once (one pass over `t`). */
export function getPaymentDirectionLabels(t: PaymentMethodLabelResolver): PaymentDirectionLabels {
  return {
    in: t(PAYMENT_DIRECTION_LABEL_KEYS.PAYIN),
    out: t(PAYMENT_DIRECTION_LABEL_KEYS.PAYOUT),
    both: t(PAYMENT_DIRECTION_LABEL_KEYS.BOTH),
  };
}

/** Resolve all identifier-kind labels at once (one pass over `t`). */
export function getIdentifierKindLabels(t: PaymentMethodLabelResolver): IdentifierKindLabels {
  return {
    email: t(IDENTIFIER_KIND_LABEL_KEYS.EMAIL),
    handle: t(IDENTIFIER_KIND_LABEL_KEYS.HANDLE),
    emailOrHandle: t(IDENTIFIER_KIND_LABEL_KEYS.EMAIL_OR_HANDLE),
  };
}

// ---------------------------------------------------------------------------
// Fixed-enum option builders (mirror `getCurrencyOptions`)
//
// Each returns a stable-ordered array of `{ value, label }` rows for use in
// `ButtonGroup` / `ToggleButtonGroup` selectors and `<Autocomplete>` lists.
// Components pass `t` in (the resolver form used elsewhere in this file) so
// the builders remain hook-free and deterministic.
// ---------------------------------------------------------------------------

export interface PaymentMethodTypeOption {
  readonly value: PaymentMethodType;
  readonly label: string;
}

export interface PaymentDirectionOption {
  readonly value: PaymentDirection;
  readonly label: string;
}

/**
 * Build the option list for the {@link PaymentMethodTypeSelector} component
 * (a `ButtonGroup` over the five `PaymentMethodType` values).
 *
 * Order mirrors `PAYMENT_METHOD_TYPES` so the picker's preferred entries stay
 * at the top; do not re-sort alphabetically mid-flow.
 */
export function getPaymentMethodTypeOptions(t: PaymentMethodLabelResolver): readonly PaymentMethodTypeOption[] {
  return PAYMENT_METHOD_TYPES.map(value => ({
    value,
    label: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[value]),
  }));
}

/** Build the option list for a `PaymentDirection` selector. */
export function getPaymentDirectionOptions(t: PaymentMethodLabelResolver): readonly PaymentDirectionOption[] {
  return PAYMENT_DIRECTIONS.map(value => ({
    value,
    label: t(PAYMENT_DIRECTION_LABEL_KEYS[value]),
  }));
}

// ---------------------------------------------------------------------------
// Catalog-row option builders
//
// Unlike the fixed-enum options above, catalog rows (mobile wallets, payment
// links, online accounts) come from GraphQL queries at runtime — there is no
// compile-time enum to mirror. These helpers convert the GraphQL-returned
// rows into the flat option-row shape consumed by the `PaymentMethodSelect`
// Autocomplete and its `PaymentMethodOptionRow` renderer.
//
// Each catalog row exposes at minimum an `id`, unique `slug`, a localized
// `name`, and an optional `logoUrl`. The converter picks the display name
// appropriate to the current UI locale; callers pass the resolver form of
// `LocalizedString` (a `Partial<Record<AppLocale, string>>`) plus the active
// locale, and fall back to the slug when no localized value is present.
// ---------------------------------------------------------------------------

/** Shared shape any catalog row must satisfy to be convertible. */
export interface PaymentMethodCatalogRow {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly logoUrl: string | null;
}

/** Flat option row consumed by `PaymentMethodSelect` + `PaymentMethodOptionRow`. */
export interface PaymentMethodCatalogOption {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly logoUrl: string | null;
}

/**
 * Resolve a `LocalizedString` to a single human-readable string for the
 * active locale, falling back to the slug (an ASCII identifier) when no
 * localized name is available. Keeps the picker deterministic and avoids
 * surfacing literal enum strings or empty content to end users.
 */
export function resolveLocalizedCatalogName(name: LocalizedString, slug: string, locale: string): string {
  return name[locale as keyof LocalizedString] ?? slug;
}

/**
 * Convert a single GraphQL catalog row to an Autocomplete option.
 *
 * Generic over the row type so concrete GraphQL codegen row shapes (which
 * will land in Phase 5) slot in without changing call-sites — only the
 * {@link PaymentMethodCatalogRow} fields are read, so extra fields are
 * preserved by the caller and ignored here.
 */
export function toPaymentMethodCatalogOption<T extends PaymentMethodCatalogRow>(
  row: T,
  locale: string,
): PaymentMethodCatalogOption {
  return {
    id: row.id,
    slug: row.slug,
    displayName: resolveLocalizedCatalogName(row.name, row.slug, locale),
    logoUrl: row.logoUrl,
  };
}

/**
 * Convert a list of GraphQL catalog rows to Autocomplete options.
 *
 * Preserves the input order (caller-owned) so that any catalog-direction /
 * `isActive` filtering applied upstream remains stable. Mirrors the
 * "stable order, do not re-sort" convention from `getCurrencyOptions`.
 */
export function toPaymentMethodCatalogOptions<T extends PaymentMethodCatalogRow>(
  rows: readonly T[],
  locale: string,
): readonly PaymentMethodCatalogOption[] {
  return rows.map(row => toPaymentMethodCatalogOption(row, locale));
}

/**
 * Build the Autocomplete input label shown for a selected catalog option:
 * `"<displayName>"`. Mirrors the `getCurrencyOptionLabel` helper pattern
 * from `frontend/components/ui/input/currencySelect/CurrencyOptionRow`.
 */
export function getPaymentMethodCatalogOptionLabel(option: PaymentMethodCatalogOption): string {
  return option.displayName;
}
