import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { PothosInputFieldBuilder, PothosObjectFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import {
  CountryCodePothosObject,
  CurrencyCodePothosObject,
  IdentifierKindPothosEnum,
  PaymentDirectionPothosEnum,
  PaymentMethodTypePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  PaymentMethodCatalogSnapshot,
  PaymentMethodDefaults,
  PaymentMethodDetails,
  PaymentMethodTransactionSnapshot,
  SupportedCommonShape,
  SupportedMobileWalletReturnType,
  SupportedOnlineAccountReturnType,
  SupportedPaymentLinkReturnType,
  UpdateUserPaymentMethodInput,
  UserPaymentMethodInitialGqlInput,
  UserPaymentMethodReturnType,
  UserPaymentMethodSubmitGqlInput,
} from "@/backend/types";

export function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function detailField(key: string, details: PaymentMethodDetails): string | null {
  if (key in details && isRecordLike(details)) {
    const record: Record<string, unknown> = details;
    const value = record[key];
    return typeof value === "string" ? value : null;
  }
  return null;
}

export const PaymentMethodDetailsRef = gqlSchemaBuilder.objectRef<PaymentMethodDetails>("PaymentMethodDetails");

export const PaymentMethodDetailsPothosObject = PaymentMethodDetailsRef.implement({
  fields: t => ({
    walletId: t.string({ nullable: true, resolve: d => detailField("walletId", d) }),
    phone: t.string({ nullable: true, resolve: d => detailField("phone", d) }),
    paymentLinkId: t.string({
      nullable: true,
      resolve: d => detailField("paymentLinkId", d),
    }),
    url: t.string({ nullable: true, resolve: d => detailField("url", d) }),
    onlineAccountId: t.string({
      nullable: true,
      resolve: d => detailField("onlineAccountId", d),
    }),
    identifier: t.string({
      nullable: true,
      resolve: d => detailField("identifier", d),
    }),
    iban: t.string({ nullable: true, resolve: d => detailField("iban", d) }),
    bankName: t.string({ nullable: true, resolve: d => detailField("bankName", d) }),
    beneficiaryName: t.string({
      nullable: true,
      resolve: d => detailField("beneficiaryName", d),
    }),
    swiftBic: t.string({ nullable: true, resolve: d => detailField("swiftBic", d) }),
    accountNumber: t.string({
      nullable: true,
      resolve: d => detailField("accountNumber", d),
    }),
    routingNumber: t.string({
      nullable: true,
      resolve: d => detailField("routingNumber", d),
    }),
    note: t.string({ nullable: true, resolve: d => detailField("note", d) }),
  }),
});

export const PaymentMethodCatalogSnapshotRef =
  gqlSchemaBuilder.objectRef<PaymentMethodCatalogSnapshot>("PaymentMethodCatalogSnapshot");

export const PaymentMethodCatalogSnapshotPothosObject = PaymentMethodCatalogSnapshotRef.implement({
  fields: t => ({
    id: t.string({ resolve: parent => parent.catalogId }),
    catalogId: t.exposeString("catalogId"),
    catalogSlug: t.exposeString("catalogSlug"),
    catalogName: t.expose("catalogName", { type: "LocalizedString" }),
  }),
});

export const PaymentMethodTransactionSnapshotRef = gqlSchemaBuilder.objectRef<PaymentMethodTransactionSnapshot>(
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

export const UserPaymentMethodRef = gqlSchemaBuilder.objectRef<UserPaymentMethodReturnType>("UserPaymentMethod");

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

export const PaymentMethodDefaultsRef = gqlSchemaBuilder.objectRef<PaymentMethodDefaults>("PaymentMethodDefaults");

export const PaymentMethodDefaultsPothosObject = PaymentMethodDefaultsRef.implement({
  fields: t => ({
    payinDefault: t.expose("payinDefault", { type: UserPaymentMethodPothosObject, nullable: true }),
    payoutDefault: t.expose("payoutDefault", { type: UserPaymentMethodPothosObject, nullable: true }),
  }),
});

export function supportedObjectCommonFields(t: PothosObjectFieldBuilder<SupportedCommonShape>) {
  return {
    id: t.exposeString("id"),
    slug: t.exposeString("slug"),
    name: t.expose("name", { type: "LocalizedString" }),
    description: t.expose("description", { type: "LocalizedString", nullable: true }),
    instructions: t.expose("instructions", { type: "LocalizedString", nullable: true }),
    supportedDirections: t.expose("supportedDirections", { type: PaymentDirectionPothosEnum }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  };
}

export const SupportedMobileWalletRef =
  gqlSchemaBuilder.objectRef<SupportedMobileWalletReturnType>("SupportedMobileWallet");

export const SupportedMobileWalletPothosObject = SupportedMobileWalletRef.implement({
  fields: t => ({
    ...supportedObjectCommonFields(t),
    countryCode: t.exposeString("countryCode", { nullable: true }),
    currencyCode: t.exposeString("currencyCode", { nullable: true }),
    phoneRegion: t.exposeString("phoneRegion", { nullable: true }),
  }),
});

export const SupportedPaymentLinkRef =
  gqlSchemaBuilder.objectRef<SupportedPaymentLinkReturnType>("SupportedPaymentLink");

export const SupportedPaymentLinkPothosObject = SupportedPaymentLinkRef.implement({
  fields: t => ({
    ...supportedObjectCommonFields(t),
    urlAllowlist: t.stringList({ resolve: parent => [...parent.urlAllowlist] }),
    urlExample: t.exposeString("urlExample", { nullable: true }),
  }),
});

export const SupportedOnlineAccountRef =
  gqlSchemaBuilder.objectRef<SupportedOnlineAccountReturnType>("SupportedOnlineAccount");

export const SupportedOnlineAccountPothosObject = SupportedOnlineAccountRef.implement({
  fields: t => ({
    ...supportedObjectCommonFields(t),
    identifierKind: t.expose("identifierKind", { type: IdentifierKindPothosEnum }),
    identifierLabel: t.expose("identifierLabel", { type: "LocalizedString" }),
  }),
});

export const PaymentMethodDetailsInputPothos = gqlSchemaBuilder.inputType("PaymentMethodDetailsInput", {
  fields: t => ({
    walletId: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    phone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    paymentLinkId: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    url: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
    onlineAccountId: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    identifier: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    iban: t.string({ required: false, directives: { constraint: { maxLength: 34 } } }),
    bankName: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    beneficiaryName: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    swiftBic: t.string({ required: false, directives: { constraint: { maxLength: 11 } } }),
    accountNumber: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    routingNumber: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    note: t.string({ required: false, directives: { constraint: { maxLength: 500 } } }),
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
    ...(input.walletId == null ? {} : { walletId: input.walletId }),
    ...(input.phone == null ? {} : { phone: input.phone }),
    ...(input.paymentLinkId == null ? {} : { paymentLinkId: input.paymentLinkId }),
    ...(input.url == null ? {} : { url: input.url }),
    ...(input.onlineAccountId == null ? {} : { onlineAccountId: input.onlineAccountId }),
    ...(input.identifier == null ? {} : { identifier: input.identifier }),
    ...(input.iban == null ? {} : { iban: input.iban }),
    ...(input.bankName == null ? {} : { bankName: input.bankName }),
    ...(input.beneficiaryName == null ? {} : { beneficiaryName: input.beneficiaryName }),
    ...(input.swiftBic == null ? {} : { swiftBic: input.swiftBic }),
    ...(input.accountNumber == null ? {} : { accountNumber: input.accountNumber }),
    ...(input.routingNumber == null ? {} : { routingNumber: input.routingNumber }),
    ...(input.note == null ? {} : { note: input.note }),
  };
}

export function userPaymentMethodCommonInputFields(t: PothosInputFieldBuilder) {
  return {
    type: t.field({ type: PaymentMethodTypePothosEnum, required: true }),
    direction: t.field({ type: PaymentDirectionPothosEnum, required: true }),
    isDefault: t.boolean({ required: false }),
    label: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    details: t.field({ type: PaymentMethodDetailsInputPothos, required: true }),
  };
}

export const UserPaymentMethodCreateInputPothos = gqlSchemaBuilder
  .inputRef<UserPaymentMethodSubmitGqlInput>("UserPaymentMethodCreateInput")
  .implement({
    fields: t => ({
      userId: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
      ...userPaymentMethodCommonInputFields(t),
    }),
  });

export const UserPaymentMethodInitialInputPothos = gqlSchemaBuilder
  .inputRef<UserPaymentMethodInitialGqlInput>("UserPaymentMethodInitialInput")
  .implement({
    fields: t => userPaymentMethodCommonInputFields(t),
  });

export const UserPaymentMethodUpdateInputPothos = gqlSchemaBuilder
  .inputRef<UpdateUserPaymentMethodInput>("UserPaymentMethodUpdateInput")
  .implement({
    fields: t => ({
      direction: t.field({ type: PaymentDirectionPothosEnum, required: false }),
      isDefault: t.boolean({ required: false }),
      label: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      details: t.field({ type: PaymentMethodDetailsInputPothos, required: false }),
    }),
  });

export function supportedInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    description: t.field({ type: "LocalizedString", required }),
    instructions: t.field({ type: "LocalizedString", required }),
    supportedDirections: t.field({ type: PaymentDirectionPothosEnum, required: false }),
    logoUrl: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
    isActive: t.boolean({ required: false }),
  };
}

export function mobileWalletInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    slug: t.string({ required }),
    name: t.field({ type: "LocalizedString", required }),
    ...supportedInputCommonFields(t, false),
    countryCode: t.field({ type: CountryCodePothosObject, required: false }),
    currencyCode: t.field({ type: CurrencyCodePothosObject, required: false }),
    phoneRegion: t.string({ required: false, directives: { constraint: { maxLength: 10 } } }),
  };
}

export function paymentLinkInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    slug: t.string({ required }),
    name: t.field({ type: "LocalizedString", required }),
    ...supportedInputCommonFields(t, false),
    urlAllowlist: t.stringList({ required, directives: { constraint: { maxItems: 50, maxLength: 2048 } } }),
    urlExample: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
  };
}

export const SupportedMobileWalletCreateInputPothos = gqlSchemaBuilder.inputType("SupportedMobileWalletCreateInput", {
  fields: t => mobileWalletInputCommonFields(t, true),
});

export const SupportedMobileWalletUpdateInputPothos = gqlSchemaBuilder.inputType("SupportedMobileWalletUpdateInput", {
  fields: t => mobileWalletInputCommonFields(t, false),
});

export const SupportedPaymentLinkCreateInputPothos = gqlSchemaBuilder.inputType("SupportedPaymentLinkCreateInput", {
  fields: t => paymentLinkInputCommonFields(t, true),
});

export const SupportedPaymentLinkUpdateInputPothos = gqlSchemaBuilder.inputType("SupportedPaymentLinkUpdateInput", {
  fields: t => paymentLinkInputCommonFields(t, false),
});

export const SupportedOnlineAccountCreateInputPothos = gqlSchemaBuilder.inputType("SupportedOnlineAccountCreateInput", {
  fields: t => ({
    slug: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    name: t.field({ type: "LocalizedString", required: true }),
    ...supportedInputCommonFields(t, false),
    identifierKind: t.field({ type: IdentifierKindPothosEnum, required: true }),
    identifierLabel: t.field({ type: "LocalizedString", required: false }),
  }),
});

export const SupportedOnlineAccountUpdateInputPothos = gqlSchemaBuilder.inputType("SupportedOnlineAccountUpdateInput", {
  fields: t => ({
    slug: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    name: t.field({ type: "LocalizedString", required: false }),
    ...supportedInputCommonFields(t, false),
    identifierKind: t.field({ type: IdentifierKindPothosEnum, required: false }),
    identifierLabel: t.field({ type: "LocalizedString", required: false }),
  }),
});
