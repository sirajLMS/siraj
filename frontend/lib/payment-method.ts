/**
 * Pure option-building helpers for payment-method UI components.
 *
 * Mirrors the API surface of `frontend/lib/currency.ts`, but where the
 * currency catalog relies on the runtime `Intl.DisplayNames` API, the
 * payment-method catalog uses `next-intl` translation keys (there is no
 * `Intl.DisplayNames` equivalent for custom enum strings). Components pass
 * the relevant `t` function in; this file stays free of any React/next-intl
 * imports so it can be unit-tested and tree-shaken.
 */

import type { PaymentMethodDisplayData } from "@/frontend/components/ui/display/paymentMethod/PaymentMethodDisplay";
import { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { PaymentMethodTransactionSnapshotFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type { LocalizedString } from "@/shared/types/localized-string";

export { IdentifierKind, PaymentDirection, PaymentMethodType };

export const PAYMENT_METHOD_TYPES: readonly PaymentMethodType[] = [
  PaymentMethodType.MobileWallet,
  PaymentMethodType.PaymentLink,
  PaymentMethodType.OnlineAccount,
  PaymentMethodType.BankTransfer,
  PaymentMethodType.Cash,
];

export const PAYMENT_DIRECTIONS: readonly PaymentDirection[] = [
  PaymentDirection.Payin,
  PaymentDirection.Payout,
  PaymentDirection.Both,
];

export const IDENTIFIER_KINDS: readonly IdentifierKind[] = [
  IdentifierKind.Email,
  IdentifierKind.Handle,
  IdentifierKind.EmailOrHandle,
];

const PAYMENT_METHOD_TYPE_LABEL_KEYS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.MobileWallet]: "ui.paymentMethod.type.mobileWallet",
  [PaymentMethodType.PaymentLink]: "ui.paymentMethod.type.paymentLink",
  [PaymentMethodType.OnlineAccount]: "ui.paymentMethod.type.onlineAccount",
  [PaymentMethodType.BankTransfer]: "ui.paymentMethod.type.bankTransfer",
  [PaymentMethodType.Cash]: "ui.paymentMethod.type.cash",
  [PaymentMethodType.ProofUpload]: "ui.paymentMethod.type.proofUpload",
};

const PAYMENT_DIRECTION_LABEL_KEYS: Record<PaymentDirection, string> = {
  [PaymentDirection.Payin]: "ui.paymentMethod.direction.in",
  [PaymentDirection.Payout]: "ui.paymentMethod.direction.out",
  [PaymentDirection.Both]: "ui.paymentMethod.direction.both",
};

export const IDENTIFIER_KIND_LABEL_KEYS: Record<IdentifierKind, string> = {
  [IdentifierKind.Email]: "ui.paymentMethod.identifier.email",
  [IdentifierKind.Handle]: "ui.paymentMethod.identifier.handle",
  [IdentifierKind.EmailOrHandle]: "ui.paymentMethod.identifier.emailOrHandle",
};

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

export function getPaymentMethodTypeLabel(type: PaymentMethodType, t: PaymentMethodLabelResolver): string {
  return t(PAYMENT_METHOD_TYPE_LABEL_KEYS[type]);
}

export function getPaymentMethodDirectionLabel(direction: PaymentDirection, t: PaymentMethodLabelResolver): string {
  return t(PAYMENT_DIRECTION_LABEL_KEYS[direction]);
}

export function getIdentifierKindLabel(kind: IdentifierKind, t: PaymentMethodLabelResolver): string {
  return t(IDENTIFIER_KIND_LABEL_KEYS[kind]);
}

export function getPaymentMethodTypeLabels(t: PaymentMethodLabelResolver): PaymentMethodTypeLabels {
  return {
    mobileWallet: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[PaymentMethodType.MobileWallet]),
    paymentLink: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[PaymentMethodType.PaymentLink]),
    onlineAccount: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[PaymentMethodType.OnlineAccount]),
    bankTransfer: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[PaymentMethodType.BankTransfer]),
    cash: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[PaymentMethodType.Cash]),
  };
}

export function getPaymentDirectionLabels(t: PaymentMethodLabelResolver): PaymentDirectionLabels {
  return {
    in: t(PAYMENT_DIRECTION_LABEL_KEYS[PaymentDirection.Payin]),
    out: t(PAYMENT_DIRECTION_LABEL_KEYS[PaymentDirection.Payout]),
    both: t(PAYMENT_DIRECTION_LABEL_KEYS[PaymentDirection.Both]),
  };
}

export function getIdentifierKindLabels(t: PaymentMethodLabelResolver): IdentifierKindLabels {
  return {
    email: t(IDENTIFIER_KIND_LABEL_KEYS[IdentifierKind.Email]),
    handle: t(IDENTIFIER_KIND_LABEL_KEYS[IdentifierKind.Handle]),
    emailOrHandle: t(IDENTIFIER_KIND_LABEL_KEYS[IdentifierKind.EmailOrHandle]),
  };
}

export interface PaymentMethodTypeOption {
  readonly value: PaymentMethodType;
  readonly label: string;
}

export interface PaymentDirectionOption {
  readonly value: PaymentDirection;
  readonly label: string;
}

export function getPaymentMethodTypeOptions(t: PaymentMethodLabelResolver): readonly PaymentMethodTypeOption[] {
  return PAYMENT_METHOD_TYPES.map(value => ({
    value,
    label: t(PAYMENT_METHOD_TYPE_LABEL_KEYS[value]),
  }));
}

export function getPaymentDirectionOptions(t: PaymentMethodLabelResolver): readonly PaymentDirectionOption[] {
  return PAYMENT_DIRECTIONS.map(value => ({
    value,
    label: t(PAYMENT_DIRECTION_LABEL_KEYS[value]),
  }));
}

export interface PaymentMethodCatalogRow {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly logoUrl: string | null;
}

export interface PaymentMethodCatalogOption {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly logoUrl: string | null;
}

export function resolveLocalizedCatalogName(name: LocalizedString, slug: string, locale: string): string {
  return name[locale as keyof LocalizedString] ?? slug;
}

export function toPaymentMethodCatalogOption<T extends PaymentMethodCatalogRow>(
  row: T,
  locale: string
): PaymentMethodCatalogOption {
  return {
    id: row.id,
    slug: row.slug,
    displayName: resolveLocalizedCatalogName(row.name, row.slug, locale),
    logoUrl: row.logoUrl,
  };
}

export function toPaymentMethodCatalogOptions<T extends PaymentMethodCatalogRow>(
  rows: readonly T[],
  locale: string
): readonly PaymentMethodCatalogOption[] {
  return rows.map(row => toPaymentMethodCatalogOption(row, locale));
}

export function getPaymentMethodCatalogOptionLabel(option: PaymentMethodCatalogOption): string {
  return option.displayName;
}

export function getPaymentMethodCatalogOptionBySlug(
  options: readonly PaymentMethodCatalogOption[],
  slug: string
): PaymentMethodCatalogOption | undefined {
  return options.find(option => option.slug === slug);
}

export function snapshotToDisplayData(
  snapshot: PaymentMethodTransactionSnapshotFieldsFragment
): PaymentMethodDisplayData {
  return {
    type: snapshot.type,
    direction: snapshot.direction,
    label: snapshot.label,
    catalogName: snapshot.catalog?.catalogName ?? null,
    catalogSlug: snapshot.catalog?.catalogSlug ?? null,
    details: snapshot.details,
    masked: true,
  };
}

export function getPaymentMethodCatalogOptionById(
  options: readonly PaymentMethodCatalogOption[],
  id: string
): PaymentMethodCatalogOption | undefined {
  return options.find(option => option.id === id);
}
