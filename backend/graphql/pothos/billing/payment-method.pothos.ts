import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CountryCodePothosObject,
  CurrencyCodePothosObject,
  IdentifierKindPothosEnum,
  PaymentDirectionPothosEnum,
  PaymentMethodTypePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  BankTransferDetails,
  CashDetails,
  MobileWalletDetails,
  OnlineAccountDetails,
  PaymentLinkDetails,
  PaymentMethodCatalogSnapshot,
  PaymentMethodDefaults,
  PaymentMethodDetails,
  PaymentMethodTransactionSnapshot,
  SupportedMobileWalletReturnType,
  SupportedOnlineAccountReturnType,
  SupportedPaymentLinkReturnType,
  UpdateUserPaymentMethodInput,
  UserPaymentMethodReturnType,
  UserPaymentMethodSubmitInput,
} from "@/backend/types/billing/payment-method.types";

function detailField<T extends PaymentMethodDetails, K extends keyof T>(
  key: K,
  details: PaymentMethodDetails
): T[K] | null {
  if (key in details) {
    return (details as T)[key] ?? null;
  }
  return null;
}

const PaymentMethodDetailsRef = gqlSchemaBuilder.objectRef<PaymentMethodDetails>("PaymentMethodDetails");

export const PaymentMethodDetailsPothosObject = PaymentMethodDetailsRef.implement({
  fields: t => ({
    walletId: t.string({ nullable: true, resolve: d => detailField<MobileWalletDetails, "walletId">("walletId", d) }),
    phone: t.string({ nullable: true, resolve: d => detailField<MobileWalletDetails, "phone">("phone", d) }),
    paymentLinkId: t.string({
      nullable: true,
      resolve: d => detailField<PaymentLinkDetails, "paymentLinkId">("paymentLinkId", d),
    }),
    url: t.string({ nullable: true, resolve: d => detailField<PaymentLinkDetails, "url">("url", d) }),
    onlineAccountId: t.string({
      nullable: true,
      resolve: d => detailField<OnlineAccountDetails, "onlineAccountId">("onlineAccountId", d),
    }),
    identifier: t.string({
      nullable: true,
      resolve: d => detailField<OnlineAccountDetails, "identifier">("identifier", d),
    }),
    iban: t.string({ nullable: true, resolve: d => detailField<BankTransferDetails, "iban">("iban", d) }),
    bankName: t.string({ nullable: true, resolve: d => detailField<BankTransferDetails, "bankName">("bankName", d) }),
    beneficiaryName: t.string({
      nullable: true,
      resolve: d => detailField<BankTransferDetails, "beneficiaryName">("beneficiaryName", d),
    }),
    swiftBic: t.string({ nullable: true, resolve: d => detailField<BankTransferDetails, "swiftBic">("swiftBic", d) }),
    accountNumber: t.string({
      nullable: true,
      resolve: d => detailField<BankTransferDetails, "accountNumber">("accountNumber", d),
    }),
    routingNumber: t.string({
      nullable: true,
      resolve: d => detailField<BankTransferDetails, "routingNumber">("routingNumber", d),
    }),
    note: t.string({ nullable: true, resolve: d => detailField<CashDetails, "note">("note", d) }),
  }),
});

const PaymentMethodCatalogSnapshotRef =
  gqlSchemaBuilder.objectRef<PaymentMethodCatalogSnapshot>("PaymentMethodCatalogSnapshot");

export const PaymentMethodCatalogSnapshotPothosObject = PaymentMethodCatalogSnapshotRef.implement({
  fields: t => ({
    catalogId: t.exposeString("catalogId"),
    catalogSlug: t.exposeString("catalogSlug"),
    catalogName: t.expose("catalogName", { type: "LocalizedString" }),
  }),
});

const PaymentMethodTransactionSnapshotRef = gqlSchemaBuilder.objectRef<PaymentMethodTransactionSnapshot>(
  "PaymentMethodTransactionSnapshot"
);

export const PaymentMethodTransactionSnapshotPothosObject = PaymentMethodTransactionSnapshotRef.implement({
  fields: t => ({
    userPaymentMethodId: t.exposeString("userPaymentMethodId", { nullable: true }),
    type: t.expose("type", { type: PaymentMethodTypePothosEnum }),
    direction: t.expose("direction", { type: PaymentDirectionPothosEnum }),
    label: t.exposeString("label", { nullable: true }),
    details: t.field({ type: PaymentMethodDetailsPothosObject, resolve: parent => parent.details }),
    catalog: t.expose("catalog", { type: PaymentMethodCatalogSnapshotPothosObject, nullable: true }),
    snapshottedAt: t.exposeString("snapshottedAt"),
  }),
});

const UserPaymentMethodRef = gqlSchemaBuilder.objectRef<UserPaymentMethodReturnType>("UserPaymentMethod");

export const UserPaymentMethodPothosObject = UserPaymentMethodRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    type: t.expose("type", { type: PaymentMethodTypePothosEnum }),
    direction: t.expose("direction", { type: PaymentDirectionPothosEnum }),
    isDefault: t.exposeBoolean("isDefault"),
    label: t.exposeString("label", { nullable: true }),
    details: t.field({ type: PaymentMethodDetailsPothosObject, resolve: parent => parent.details }),
    verifiedAt: t.expose("verifiedAt", { type: "DateTime", nullable: true }),
    verifiedByUserId: t.exposeString("verifiedByUserId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const PaymentMethodDefaultsRef = gqlSchemaBuilder.objectRef<PaymentMethodDefaults>("PaymentMethodDefaults");

export const PaymentMethodDefaultsPothosObject = PaymentMethodDefaultsRef.implement({
  fields: t => ({
    payinDefault: t.expose("payinDefault", { type: UserPaymentMethodPothosObject, nullable: true }),
    payoutDefault: t.expose("payoutDefault", { type: UserPaymentMethodPothosObject, nullable: true }),
  }),
});

const SupportedMobileWalletRef = gqlSchemaBuilder.objectRef<SupportedMobileWalletReturnType>("SupportedMobileWallet");

export const SupportedMobileWalletPothosObject = SupportedMobileWalletRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    slug: t.exposeString("slug"),
    name: t.expose("name", { type: "LocalizedString" }),
    description: t.expose("description", { type: "LocalizedString", nullable: true }),
    instructions: t.expose("instructions", { type: "LocalizedString", nullable: true }),
    countryCode: t.exposeString("countryCode", { nullable: true }),
    currencyCode: t.exposeString("currencyCode", { nullable: true }),
    phoneRegion: t.exposeString("phoneRegion", { nullable: true }),
    supportedDirections: t.expose("supportedDirections", { type: PaymentDirectionPothosEnum }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const SupportedPaymentLinkRef = gqlSchemaBuilder.objectRef<SupportedPaymentLinkReturnType>("SupportedPaymentLink");

export const SupportedPaymentLinkPothosObject = SupportedPaymentLinkRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    slug: t.exposeString("slug"),
    name: t.expose("name", { type: "LocalizedString" }),
    description: t.expose("description", { type: "LocalizedString", nullable: true }),
    instructions: t.expose("instructions", { type: "LocalizedString", nullable: true }),
    urlAllowlist: t.stringList({ resolve: parent => [...parent.urlAllowlist] }),
    urlExample: t.exposeString("urlExample", { nullable: true }),
    supportedDirections: t.expose("supportedDirections", { type: PaymentDirectionPothosEnum }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const SupportedOnlineAccountRef =
  gqlSchemaBuilder.objectRef<SupportedOnlineAccountReturnType>("SupportedOnlineAccount");

export const SupportedOnlineAccountPothosObject = SupportedOnlineAccountRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    slug: t.exposeString("slug"),
    name: t.expose("name", { type: "LocalizedString" }),
    description: t.expose("description", { type: "LocalizedString", nullable: true }),
    instructions: t.expose("instructions", { type: "LocalizedString", nullable: true }),
    identifierKind: t.expose("identifierKind", { type: IdentifierKindPothosEnum }),
    identifierLabel: t.expose("identifierLabel", { type: "LocalizedString" }),
    supportedDirections: t.expose("supportedDirections", { type: PaymentDirectionPothosEnum }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const PaymentMethodDetailsInputPothos = gqlSchemaBuilder.inputType("PaymentMethodDetailsInput", {
  fields: t => ({
    walletId: t.string({ required: false }),
    phone: t.string({ required: false }),
    paymentLinkId: t.string({ required: false }),
    url: t.string({ required: false }),
    onlineAccountId: t.string({ required: false }),
    identifier: t.string({ required: false }),
    iban: t.string({ required: false }),
    bankName: t.string({ required: false }),
    beneficiaryName: t.string({ required: false }),
    swiftBic: t.string({ required: false }),
    accountNumber: t.string({ required: false }),
    routingNumber: t.string({ required: false }),
    note: t.string({ required: false }),
  }),
});

export function normalizePaymentMethodDetailsInput(input: {
  readonly walletId?: string | null;
  readonly phone?: string | null;
  readonly paymentLinkId?: string | null;
  readonly url?: string | null;
  readonly onlineAccountId?: string | null;
  readonly identifier?: string | null;
  readonly iban?: string | null;
  readonly bankName?: string | null;
  readonly beneficiaryName?: string | null;
  readonly swiftBic?: string | null;
  readonly accountNumber?: string | null;
  readonly routingNumber?: string | null;
  readonly note?: string | null;
}): PaymentMethodDetails {
  return {
    ...(input.walletId != null ? { walletId: input.walletId } : {}),
    ...(input.phone != null ? { phone: input.phone } : {}),
    ...(input.paymentLinkId != null ? { paymentLinkId: input.paymentLinkId } : {}),
    ...(input.url != null ? { url: input.url } : {}),
    ...(input.onlineAccountId != null ? { onlineAccountId: input.onlineAccountId } : {}),
    ...(input.identifier != null ? { identifier: input.identifier } : {}),
    ...(input.iban != null ? { iban: input.iban } : {}),
    ...(input.bankName != null ? { bankName: input.bankName } : {}),
    ...(input.beneficiaryName != null ? { beneficiaryName: input.beneficiaryName } : {}),
    ...(input.swiftBic != null ? { swiftBic: input.swiftBic } : {}),
    ...(input.accountNumber != null ? { accountNumber: input.accountNumber } : {}),
    ...(input.routingNumber != null ? { routingNumber: input.routingNumber } : {}),
    ...(input.note != null ? { note: input.note } : {}),
  } as PaymentMethodDetails;
}

export type UserPaymentMethodSubmitGqlInput = Omit<UserPaymentMethodSubmitInput, "details" | "isDefault"> & {
  readonly details: PaymentMethodDetails;
  readonly isDefault?: boolean;
};

export const UserPaymentMethodCreateInputPothos = gqlSchemaBuilder
  .inputRef<UserPaymentMethodSubmitGqlInput>("UserPaymentMethodCreateInput")
  .implement({
    fields: t => ({
      userId: t.string({ required: true }),
      type: t.field({ type: PaymentMethodTypePothosEnum, required: true }),
      direction: t.field({ type: PaymentDirectionPothosEnum, required: true }),
      isDefault: t.boolean({ required: false }),
      label: t.string({ required: false }),
      details: t.field({ type: PaymentMethodDetailsInputPothos, required: true }),
    }),
  });

export type UserPaymentMethodInitialGqlInput = Omit<
  UserPaymentMethodSubmitInput,
  "userId" | "details" | "isDefault"
> & {
  readonly details: PaymentMethodDetails;
  readonly isDefault?: boolean;
};

export const UserPaymentMethodInitialInputPothos = gqlSchemaBuilder
  .inputRef<UserPaymentMethodInitialGqlInput>("UserPaymentMethodInitialInput")
  .implement({
    fields: t => ({
      type: t.field({ type: PaymentMethodTypePothosEnum, required: true }),
      direction: t.field({ type: PaymentDirectionPothosEnum, required: true }),
      isDefault: t.boolean({ required: false }),
      label: t.string({ required: false }),
      details: t.field({ type: PaymentMethodDetailsInputPothos, required: true }),
    }),
  });

export const UserPaymentMethodUpdateInputPothos = gqlSchemaBuilder
  .inputRef<UpdateUserPaymentMethodInput>("UserPaymentMethodUpdateInput")
  .implement({
    fields: t => ({
      direction: t.field({ type: PaymentDirectionPothosEnum, required: false }),
      isDefault: t.boolean({ required: false }),
      label: t.string({ required: false }),
      details: t.field({ type: PaymentMethodDetailsInputPothos, required: false }),
    }),
  });

export const SupportedMobileWalletCreateInputPothos = gqlSchemaBuilder.inputType("SupportedMobileWalletCreateInput", {
  fields: t => ({
    slug: t.string({ required: true }),
    name: t.field({ type: "LocalizedString", required: true }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    countryCode: t.field({ type: CountryCodePothosObject, required: false }),
    currencyCode: t.field({ type: CurrencyCodePothosObject, required: false }),
    phoneRegion: t.string({ required: false }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

export const SupportedMobileWalletUpdateInputPothos = gqlSchemaBuilder.inputType("SupportedMobileWalletUpdateInput", {
  fields: t => ({
    slug: t.string({ required: false }),
    name: t.field({ type: "LocalizedString", required: false }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    countryCode: t.field({ type: CountryCodePothosObject, required: false }),
    currencyCode: t.field({ type: CurrencyCodePothosObject, required: false }),
    phoneRegion: t.string({ required: false }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

export const SupportedPaymentLinkCreateInputPothos = gqlSchemaBuilder.inputType("SupportedPaymentLinkCreateInput", {
  fields: t => ({
    slug: t.string({ required: true }),
    name: t.field({ type: "LocalizedString", required: true }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    urlAllowlist: t.stringList({ required: true }),
    urlExample: t.string({ required: false }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

export const SupportedPaymentLinkUpdateInputPothos = gqlSchemaBuilder.inputType("SupportedPaymentLinkUpdateInput", {
  fields: t => ({
    slug: t.string({ required: false }),
    name: t.field({ type: "LocalizedString", required: false }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    urlAllowlist: t.stringList({ required: false }),
    urlExample: t.string({ required: false }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

export const SupportedOnlineAccountCreateInputPothos = gqlSchemaBuilder.inputType("SupportedOnlineAccountCreateInput", {
  fields: t => ({
    slug: t.string({ required: true }),
    name: t.field({ type: "LocalizedString", required: true }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    identifierKind: t.field({ type: IdentifierKindPothosEnum, required: true }),
    identifierLabel: t.field({ type: "LocalizedString", required: false }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

export const SupportedOnlineAccountUpdateInputPothos = gqlSchemaBuilder.inputType("SupportedOnlineAccountUpdateInput", {
  fields: t => ({
    slug: t.string({ required: false }),
    name: t.field({ type: "LocalizedString", required: false }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    identifierKind: t.field({ type: IdentifierKindPothosEnum, required: false }),
    identifierLabel: t.field({ type: "LocalizedString", required: false }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});
