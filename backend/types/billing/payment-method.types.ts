import type { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

// ============================================================================
// Details discriminated union (spec § Data model)
//
// The `details` JSONB column itself does not carry a `type` discriminator;
// the parent `user_payment_methods` row carries `type` + `details`, and the
// service layer validates them together via discriminated Zod. So
// `PaymentMethodDetails` is a plain union used for the JSONB `details` column.
// ============================================================================

export type MobileWalletDetails = {
  readonly walletId: string;
  readonly phone: string;
};

export type PaymentLinkDetails = {
  readonly paymentLinkId: string;
  readonly url: string;
};

export type OnlineAccountDetails = {
  readonly onlineAccountId: string;
  readonly identifier: string;
};

export type BankTransferDetails = {
  readonly iban?: string;
  readonly bankName?: string;
  readonly beneficiaryName?: string;
  readonly swiftBic?: string;
  readonly accountNumber?: string;
  readonly routingNumber?: string;
};

export type CashDetails = {
  readonly note?: string;
};

export type PaymentMethodDetails =
  | MobileWalletDetails
  | PaymentLinkDetails
  | OnlineAccountDetails
  | BankTransferDetails
  | CashDetails;

// ============================================================================
// Transaction snapshot (frozen on every pay-in/pay-out; audit source of truth)
// Written once at transaction creation; never mutated by later method edits.
// ============================================================================

export type PaymentMethodCatalogSnapshot = {
  readonly catalogId: string;
  readonly catalogSlug: string;
  readonly catalogName: LocalizedString;
};

export type PaymentProofSnapshot = {
  readonly fileId: string;
  readonly filePath: string;
  readonly mimeType: string;
  readonly submittedByUserId: string;
  readonly submittedAt: string;
};

export type PaymentProofTransactionSnapshot = {
  readonly type: PaymentMethodType.PROOF_UPLOAD;
  readonly proof: PaymentProofSnapshot;
  readonly snapshottedAt: string;
};

export type PaymentMethodTransactionSnapshot = {
  readonly userPaymentMethodId: string | null;
  readonly type: PaymentMethodType;
  readonly direction: PaymentDirection;
  readonly label: string | null;
  readonly details: PaymentMethodDetails;
  readonly catalog: PaymentMethodCatalogSnapshot | null;
  readonly snapshottedAt: string; // ISO timestamp
};

// ============================================================================
// `user_payment_methods` — live/mutable saved methods
//
// NOTE: the Drizzle table does not exist yet (created in Phase 2), so these
// types are defined explicitly per the spec rather than via `$inferSelect`.
// Once Phase 2 lands the table, these can be refactored to derive from the
// schema the way `InvoiceSelectType`/`PaymentSelectType` do in billing.types.ts.
// ============================================================================

export type UserPaymentMethodSelectType = {
  readonly id: string;
  readonly userId: string;
  readonly type: PaymentMethodType;
  readonly direction: PaymentDirection;
  readonly isDefault: boolean;
  readonly label: string | null;
  readonly details: PaymentMethodDetails;
  readonly verifiedAt: Date | null;
  readonly verifiedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type UserPaymentMethodInsertType = {
  readonly id?: string;
  readonly userId: string;
  readonly type: PaymentMethodType;
  readonly direction: PaymentDirection;
  readonly isDefault: boolean;
  readonly label?: string | null;
  readonly details: PaymentMethodDetails;
  readonly verifiedAt?: Date | null;
  readonly verifiedByUserId?: string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type UserPaymentMethodReturnType = Omit<UserPaymentMethodSelectType, never> & {
  // Reapply enums (compile-time only; runtime value already matches)
  type: PaymentMethodType;
  direction: PaymentDirection;
};

export type UserPaymentMethodSubmitInput = Omit<
  UserPaymentMethodInsertType,
  "id" | "createdAt" | "updatedAt" | "verifiedAt" | "verifiedByUserId"
>;

export type UpdateUserPaymentMethodInput = Partial<Omit<UserPaymentMethodSubmitInput, "userId" | "type">>;

// ============================================================================
// `PaymentMethodDefaults` — computed per-user default slots
// ============================================================================

export type PaymentMethodDefaults = {
  readonly payinDefault: UserPaymentMethodReturnType | null;
  readonly payoutDefault: UserPaymentMethodReturnType | null;
};

// ============================================================================
// Catalog tables (admin-managed JSONB inventories).
//
// `supported_mobile_wallets`   — mobile wallet catalog
// `supported_payment_links`    — payment-link catalog
// `supported_online_accounts`  — online account catalog
//
// As with `user_payment_methods`, the Drizzle tables for these do not exist
// yet (Phase 2), so the types are defined explicitly per the spec. `ReturnType`
// variants reapply enum typing on top of the `SelectType` shape.
// ============================================================================

// ---------------------------------------------------------------------------
// supported_mobile_wallets
// ---------------------------------------------------------------------------

export type SupportedMobileWalletSelectType = {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description: LocalizedString | null;
  readonly instructions: LocalizedString | null;
  readonly countryCode: string | null;
  readonly currencyCode: string | null;
  readonly phoneRegion: string | null;
  readonly supportedDirections: PaymentDirection;
  readonly logoUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type SupportedMobileWalletInsertType = {
  readonly id?: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description?: LocalizedString | null;
  readonly instructions?: LocalizedString | null;
  readonly countryCode?: string | null;
  readonly currencyCode?: string | null;
  readonly phoneRegion?: string | null;
  readonly supportedDirections?: PaymentDirection;
  readonly logoUrl?: string | null;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type SupportedMobileWalletReturnType = Omit<SupportedMobileWalletSelectType, never> & {
  supportedDirections: PaymentDirection;
};

export type SupportedMobileWalletSubmitInput = Omit<SupportedMobileWalletInsertType, "id" | "createdAt" | "updatedAt">;

export type UpdateSupportedMobileWalletInput = Partial<SupportedMobileWalletSubmitInput>;

// ---------------------------------------------------------------------------
// supported_payment_links
// ---------------------------------------------------------------------------

export type SupportedPaymentLinkSelectType = {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description: LocalizedString | null;
  readonly instructions: LocalizedString | null;
  readonly urlAllowlist: readonly string[];
  readonly urlExample: string | null;
  readonly supportedDirections: PaymentDirection;
  readonly logoUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type SupportedPaymentLinkInsertType = {
  readonly id?: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description?: LocalizedString | null;
  readonly instructions?: LocalizedString | null;
  readonly urlAllowlist: readonly string[];
  readonly urlExample?: string | null;
  readonly supportedDirections?: PaymentDirection;
  readonly logoUrl?: string | null;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type SupportedPaymentLinkReturnType = Omit<SupportedPaymentLinkSelectType, never> & {
  supportedDirections: PaymentDirection;
};

export type SupportedPaymentLinkSubmitInput = Omit<SupportedPaymentLinkInsertType, "id" | "createdAt" | "updatedAt">;

export type UpdateSupportedPaymentLinkInput = Partial<SupportedPaymentLinkSubmitInput>;

// ---------------------------------------------------------------------------
// supported_online_accounts
// ---------------------------------------------------------------------------

export type SupportedOnlineAccountSelectType = {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description: LocalizedString | null;
  readonly instructions: LocalizedString | null;
  readonly identifierKind: IdentifierKind;
  readonly identifierLabel: LocalizedString;
  readonly supportedDirections: PaymentDirection;
  readonly logoUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type SupportedOnlineAccountInsertType = {
  readonly id?: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description?: LocalizedString | null;
  readonly instructions?: LocalizedString | null;
  readonly identifierKind: IdentifierKind;
  readonly identifierLabel?: LocalizedString;
  readonly supportedDirections?: PaymentDirection;
  readonly logoUrl?: string | null;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type SupportedOnlineAccountReturnType = Omit<SupportedOnlineAccountSelectType, never> & {
  identifierKind: IdentifierKind;
  supportedDirections: PaymentDirection;
};

export type SupportedOnlineAccountSubmitInput = Omit<
  SupportedOnlineAccountInsertType,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateSupportedOnlineAccountInput = Partial<SupportedOnlineAccountSubmitInput>;
