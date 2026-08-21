import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentCatalogsLabels } from "@/shared/locale";

export type PaymentCatalogKind = "mobileWallet" | "paymentLink" | "onlineAccount";

export type PaymentCatalogRow =
  | SupportedMobileWalletFieldsFragment
  | SupportedPaymentLinkFieldsFragment
  | SupportedOnlineAccountFieldsFragment;

export interface CatalogGridActionHandlers {
  readonly onEdit: (row: PaymentCatalogRow) => void;
  readonly onDelete: (row: PaymentCatalogRow) => void;
}

export interface CatalogDeleteDialogProps {
  readonly labels: PaymentCatalogsLabels;
  readonly open: boolean;
  readonly entryName: string;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void | Promise<void>;
}

export interface CatalogEditDialogProps {
  readonly labels: PaymentCatalogsLabels;
  readonly open: boolean;
  readonly kind: PaymentCatalogKind;
  readonly row: PaymentCatalogRow | null;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
}
