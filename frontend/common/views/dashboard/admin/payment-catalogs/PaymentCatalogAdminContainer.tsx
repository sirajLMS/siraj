"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import {
  deactivateSupportedMobileWalletMutationDocument,
  deactivateSupportedOnlineAccountMutationDocument,
  deactivateSupportedPaymentLinkMutationDocument,
  supportedMobileWalletsQueryDocument,
  supportedOnlineAccountsQueryDocument,
  supportedPaymentLinksQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { logger } from "@/frontend/common/utils/logger";
import { CatalogDeleteDialog } from "@/frontend/common/views/dashboard/admin/payment-catalogs/components/CatalogDeleteDialog";
import { CatalogEditDialog } from "@/frontend/common/views/dashboard/admin/payment-catalogs/components/CatalogEditDialog";
import { PaymentCatalogAdminView } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView";
import type {
  PaymentCatalogKind,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { useAppTranslation } from "@/shared/locale";

function resolveEntryName(row: PaymentCatalogRow | null, locale: string): string {
  if (!row?.name) return row?.slug ?? "";
  const localized = row.name[locale as "en" | "ar"] ?? row.name.en ?? row.name.ar ?? row.slug;
  return localized ?? row.slug ?? "";
}

export function PaymentCatalogAdminContainer() {
  const locale = useAppLocale();
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
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
    notifications.show(t.saveSuccess, { severity: "success" });
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
      notifications.show(t.deactivateSuccess, { severity: "success" });
      await refetchActive();
    } catch (error) {
      logger.error("Failed to deactivate catalog entry", { error });
      notifications.show(t.deactivateError, { severity: "error" });
    } finally {
      setIsDeactivating(false);
      setDeleteRow(null);
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.PaymentMethodsManageCatalogs]}>
      <PaymentCatalogAdminView
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileWallets={mobileWallets}
        paymentLinks={paymentLinks}
        onlineAccounts={onlineAccounts}
        loading={loading}
        onAdd={() => {
          setEditRow(null);
          setEditOpen(true);
        }}
        onEdit={row => {
          setEditRow(row);
          setEditOpen(true);
        }}
        onDelete={row => setDeleteRow(row)}
      />

      <CatalogEditDialog
        open={editOpen}
        kind={activeTab}
        row={editRow}
        onClose={() => {
          setEditOpen(false);
          setEditRow(null);
        }}
        onSaved={handleSaved}
      />

      <CatalogDeleteDialog
        open={Boolean(deleteRow)}
        entryName={resolveEntryName(deleteRow, locale)}
        isLoading={isDeactivating}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleConfirmDelete}
      />
    </RequirePermission>
  );
}
