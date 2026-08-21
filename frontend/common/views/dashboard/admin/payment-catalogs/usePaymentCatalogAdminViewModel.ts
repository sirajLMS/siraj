"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo, useState } from "react";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deactivateSupportedMobileWalletMutationDocument,
  deactivateSupportedOnlineAccountMutationDocument,
  deactivateSupportedPaymentLinkMutationDocument,
  supportedMobileWalletsQueryDocument,
  supportedOnlineAccountsQueryDocument,
  supportedPaymentLinksQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { logger } from "@/frontend/common/utils/logger";
import type {
  PaymentCatalogKind,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { type PaymentCatalogsLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface PaymentCatalogAdminViewModel {
  readonly labels: PaymentCatalogsLabels;
  readonly activeTab: PaymentCatalogKind;
  readonly onTabChange: (tab: PaymentCatalogKind) => void;
  readonly mobileWallets: readonly SupportedMobileWalletFieldsFragment[];
  readonly paymentLinks: readonly SupportedPaymentLinkFieldsFragment[];
  readonly onlineAccounts: readonly SupportedOnlineAccountFieldsFragment[];
  readonly loading: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (row: PaymentCatalogRow) => void;
  readonly onDelete: (row: PaymentCatalogRow) => void;
  // Dialog state
  readonly editOpen: boolean;
  readonly editRow: PaymentCatalogRow | null;
  readonly deleteRow: PaymentCatalogRow | null;
  readonly isDeactivating: boolean;
  readonly setEditOpen: (value: boolean) => void;
  readonly setEditRow: (row: PaymentCatalogRow | null) => void;
  readonly setDeleteRow: (row: PaymentCatalogRow | null) => void;
  readonly handleSaved: () => Promise<void>;
  readonly handleConfirmDelete: () => Promise<void>;
}

export type UsePaymentCatalogAdminViewModelProps = Record<string, never>;

export function usePaymentCatalogAdminViewModel(
  _props: Readonly<UsePaymentCatalogAdminViewModelProps>
): PaymentCatalogAdminViewModel {
  const labels = useAppTranslation(Translation.Dashboard.PaymentCatalogs);
  const notifications = useNotifications();
  const [activeTab, setActiveTab] = useState<PaymentCatalogKind>("mobileWallet");
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<PaymentCatalogRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<PaymentCatalogRow | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    data: walletData,
    loading: walletsLoading,
    refetch: refetchWallets,
  } = useQuery(supportedMobileWalletsQueryDocument, {
    variables: { activeOnly: false, countryCode: null, direction: null },
    skip: activeTab !== "mobileWallet",
  });
  const {
    data: linkData,
    loading: linksLoading,
    refetch: refetchLinks,
  } = useQuery(supportedPaymentLinksQueryDocument, {
    variables: { activeOnly: false, direction: null },
    skip: activeTab !== "paymentLink",
  });
  const {
    data: accountData,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery(supportedOnlineAccountsQueryDocument, {
    variables: { activeOnly: false, direction: null },
    skip: activeTab !== "onlineAccount",
  });

  const [deactivateWallet] = useMutation(deactivateSupportedMobileWalletMutationDocument);
  const [deactivateLink] = useMutation(deactivateSupportedPaymentLinkMutationDocument);
  const [deactivateAccount] = useMutation(deactivateSupportedOnlineAccountMutationDocument);

  const mobileWallets = useMemo(
    () => (walletData?.supportedMobileWallets ?? []) as SupportedMobileWalletFieldsFragment[],
    [walletData?.supportedMobileWallets]
  );
  const paymentLinks = useMemo(
    () => (linkData?.supportedPaymentLinks ?? []) as SupportedPaymentLinkFieldsFragment[],
    [linkData?.supportedPaymentLinks]
  );
  const onlineAccounts = useMemo(
    () => (accountData?.supportedOnlineAccounts ?? []) as SupportedOnlineAccountFieldsFragment[],
    [accountData?.supportedOnlineAccounts]
  );

  const loading =
    (activeTab === "mobileWallet" && walletsLoading) ||
    (activeTab === "paymentLink" && linksLoading) ||
    (activeTab === "onlineAccount" && accountsLoading);

  const refetchActive = async () => {
    if (activeTab === "mobileWallet") await refetchWallets();
    if (activeTab === "paymentLink") await refetchLinks();
    if (activeTab === "onlineAccount") await refetchAccounts();
  };

  const handleSaved = async () => {
    setEditOpen(false);
    setEditRow(null);
    notifications.show(labels.saveSuccess, { severity: "success" });
    await refetchActive();
  };

  const handleConfirmDelete = async () => {
    if (!deleteRow?.id) return;
    setIsDeactivating(true);
    try {
      if (activeTab === "mobileWallet") {
        await deactivateWallet({ variables: { id: deleteRow.id } });
      } else if (activeTab === "paymentLink") {
        await deactivateLink({ variables: { id: deleteRow.id } });
      } else if (activeTab === "onlineAccount") {
        await deactivateAccount({ variables: { id: deleteRow.id } });
      } else {
        return;
      }
      notifications.show(labels.deactivateSuccess, { severity: "success" });
      await refetchActive();
    } catch (error) {
      logger.error("Failed to deactivate catalog entry", { error });
      notifications.show(labels.deactivateError, { severity: "error" });
    } finally {
      setIsDeactivating(false);
      setDeleteRow(null);
    }
  };

  return {
    labels,
    activeTab,
    onTabChange: setActiveTab,
    mobileWallets,
    paymentLinks,
    onlineAccounts,
    loading,
    onAdd: () => {
      setEditRow(null);
      setEditOpen(true);
    },
    onEdit: row => {
      setEditRow(row);
      setEditOpen(true);
    },
    onDelete: row => setDeleteRow(row),
    editOpen,
    editRow,
    deleteRow,
    isDeactivating,
    setEditOpen,
    setEditRow,
    setDeleteRow,
    handleSaved,
    handleConfirmDelete,
  };
}
