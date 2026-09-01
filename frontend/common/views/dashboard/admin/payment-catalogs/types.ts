import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";

export type PaymentCatalogKind = "mobileWallet" | "paymentLink" | "onlineAccount";

export type PaymentCatalogRow =
  | SupportedMobileWalletFieldsFragment
  | SupportedPaymentLinkFieldsFragment
  | SupportedOnlineAccountFieldsFragment;

export interface CatalogGridActionHandlers {
  readonly onEdit: (row: PaymentCatalogRow) => void;
  readonly onDelete: (row: PaymentCatalogRow) => void;
}
