"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useState } from "react";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PaymentCatalogKind,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import {
  usePaymentCatalogDeactivate,
  usePaymentCatalogQueries,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel.hooks";
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

  const { mobileWallets, paymentLinks, onlineAccounts, loading, refetchActive } = usePaymentCatalogQueries(activeTab);
  const { isDeactivating, handleConfirmDelete } = usePaymentCatalogDeactivate({
    activeTab,
    deleteRow,
    labels,
    notifications,
    refetchActive,
    setDeleteRow,
  });

  const handleSaved = async () => {
    setEditOpen(false);
    setEditRow(null);
    notifications.show(labels.saveSuccess, { severity: "success" });
    await refetchActive();
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
