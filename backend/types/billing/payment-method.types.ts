import type {
  supportedMobileWallets,
  supportedOnlineAccounts,
  supportedPaymentLinks,
  userPaymentMethods,
} from "@/backend/db/schema";
import type { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { LocalizedString } from "@/shared/types";

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
// ============================================================================

export type UserPaymentMethodSelectType = typeof userPaymentMethods.$inferSelect;
export type UserPaymentMethodInsertType = typeof userPaymentMethods.$inferInsert;

export type UserPaymentMethodReturnType = Omit<UserPaymentMethodSelectType, "type" | "direction"> & {
  type: PaymentMethodType;
  direction: PaymentDirection;
};

export type UserPaymentMethodSubmitInput = Omit<
  UserPaymentMethodInsertType,
  "id" | "createdAt" | "updatedAt" | "verifiedAt" | "verifiedByUserId" | "type" | "direction"
> & {
  type: PaymentMethodType;
  direction: PaymentDirection;
};

export type UpdateUserPaymentMethodInput = Partial<Omit<UserPaymentMethodSubmitInput, "userId" | "type">>;

/**
 * GraphQL-specific submit input for user payment methods.
 * Re-typifies `details` as `PaymentMethodDetails` (instead of the JSONB column type)
 * and makes `isDefault` optional for GraphQL input flexibility.
 */
export type UserPaymentMethodSubmitGqlInput = Omit<UserPaymentMethodSubmitInput, "details" | "isDefault"> & {
  readonly details: PaymentMethodDetails;
  readonly isDefault?: boolean;
};

/**
 * GraphQL-specific initial input for user payment methods (no `userId`).
 * Used by onboarding mutations (parent/teacher) that attach the method to
 * the newly-created user, so `userId` is not part of the input.
 */
export type UserPaymentMethodInitialGqlInput = Omit<
  UserPaymentMethodSubmitInput,
  "userId" | "details" | "isDefault"
> & {
  readonly details: PaymentMethodDetails;
  readonly isDefault?: boolean;
};

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
// `ReturnType` variants reapply enum typing on top of the `SelectType` shape.
// ============================================================================

// ---------------------------------------------------------------------------
// supported_mobile_wallets
// ---------------------------------------------------------------------------

export type SupportedMobileWalletSelectType = typeof supportedMobileWallets.$inferSelect;
export type SupportedMobileWalletInsertType = typeof supportedMobileWallets.$inferInsert;

export type SupportedMobileWalletReturnType = Omit<SupportedMobileWalletSelectType, "supportedDirections"> & {
  supportedDirections: PaymentDirection;
};

export type SupportedMobileWalletSubmitInput = Omit<
  SupportedMobileWalletInsertType,
  "id" | "createdAt" | "updatedAt" | "supportedDirections"
> & {
  supportedDirections: PaymentDirection;
};

export type UpdateSupportedMobileWalletInput = Partial<SupportedMobileWalletSubmitInput>;

// ---------------------------------------------------------------------------
// supported_payment_links
// ---------------------------------------------------------------------------

export type SupportedPaymentLinkSelectType = typeof supportedPaymentLinks.$inferSelect;
export type SupportedPaymentLinkInsertType = typeof supportedPaymentLinks.$inferInsert;

export type SupportedPaymentLinkReturnType = Omit<SupportedPaymentLinkSelectType, "supportedDirections"> & {
  supportedDirections: PaymentDirection;
};

export type SupportedPaymentLinkSubmitInput = Omit<
  SupportedPaymentLinkInsertType,
  "id" | "createdAt" | "updatedAt" | "supportedDirections"
> & {
  supportedDirections: PaymentDirection;
};

export type UpdateSupportedPaymentLinkInput = Partial<SupportedPaymentLinkSubmitInput>;

// ---------------------------------------------------------------------------
// supported_online_accounts
// ---------------------------------------------------------------------------

export type SupportedOnlineAccountSelectType = typeof supportedOnlineAccounts.$inferSelect;
export type SupportedOnlineAccountInsertType = typeof supportedOnlineAccounts.$inferInsert;

export type SupportedOnlineAccountReturnType = Omit<
  SupportedOnlineAccountSelectType,
  "identifierKind" | "supportedDirections"
> & {
  identifierKind: IdentifierKind;
  supportedDirections: PaymentDirection;
};

export type SupportedOnlineAccountSubmitInput = Omit<
  SupportedOnlineAccountInsertType,
  "id" | "createdAt" | "updatedAt" | "identifierKind" | "supportedDirections"
> & {
  identifierKind: IdentifierKind;
  supportedDirections: PaymentDirection;
};

export type UpdateSupportedOnlineAccountInput = Partial<SupportedOnlineAccountSubmitInput>;

/**
 * Shared shape covering the common fields of `SupportedMobileWalletReturnType`,
 * `SupportedPaymentLinkReturnType`, and `SupportedOnlineAccountReturnType`.
 * Used by Pothos field helpers to type-check shared field definitions.
 */
export type SupportedCommonShape = Pick<
  SupportedMobileWalletReturnType,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "instructions"
  | "supportedDirections"
  | "logoUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;
