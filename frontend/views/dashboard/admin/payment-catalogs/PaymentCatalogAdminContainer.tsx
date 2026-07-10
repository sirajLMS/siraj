"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/graphql/generated/gql/operations";
import {
  deactivateSupportedMobileWalletMutationDocument,
  deactivateSupportedOnlineAccountMutationDocument,
  deactivateSupportedPaymentLinkMutationDocument,
  supportedMobileWalletsQueryDocument,
  supportedOnlineAccountsQueryDocument,
  supportedPaymentLinksQueryDocument,
} from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { CatalogDeleteDialog } from "@/frontend/views/dashboard/admin/payment-catalogs/components/CatalogDeleteDialog";
import { CatalogEditDialog } from "@/frontend/views/dashboard/admin/payment-catalogs/components/CatalogEditDialog";
import { PaymentCatalogAdminView } from "@/frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView";
import type { PaymentCatalogKind, PaymentCatalogRow } from "@/frontend/views/dashboard/admin/payment-catalogs/types";

function resolveEntryName(row: PaymentCatalogRow | null, locale: string): string {
  if (!row?.name) return row?.slug ?? "";
  const localized = row.name[locale as "en" | "ar"] ?? row.name.en ?? row.name.ar ?? row.slug;
  return localized ?? row.slug ?? "";
}

export function PaymentCatalogAdminContainer() {
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<PaymentCatalogKind>("mobileWallet");
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<PaymentCatalogRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<PaymentCatalogRow | null>(null);

  const {
    data: walletData,
    loading: walletsLoading,
    refetch: refetchWallets,
  } = useQuery(supportedMobileWalletsQueryDocument, {
    variables: { activeOnly: false, countryCode: null, direction: null },
  });
  const {
    data: linkData,
    loading: linksLoading,
    refetch: refetchLinks,
  } = useQuery(supportedPaymentLinksQueryDocument, { variables: { activeOnly: false, direction: null } });
  const {
    data: accountData,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery(supportedOnlineAccountsQueryDocument, { variables: { activeOnly: false, direction: null } });

  const [deactivateWallet, { loading: deactivatingWallet }] = useMutation(
    deactivateSupportedMobileWalletMutationDocument
  );
  const [deactivateLink, { loading: deactivatingLink }] = useMutation(deactivateSupportedPaymentLinkMutationDocument);
  const [deactivateAccount, { loading: deactivatingAccount }] = useMutation(
    deactivateSupportedOnlineAccountMutationDocument
  );

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

  const loading = walletsLoading || linksLoading || accountsLoading;
  const isDeleting = deactivatingWallet || deactivatingLink || deactivatingAccount;

  const refetchActive = async () => {
    if (activeTab === "mobileWallet") await refetchWallets();
    if (activeTab === "paymentLink") await refetchLinks();
    if (activeTab === "onlineAccount") await refetchAccounts();
  };

  const handleSaved = async () => {
    setEditOpen(false);
    setEditRow(null);
    await refetchActive();
  };

  const handleConfirmDelete = async () => {
    if (!deleteRow?.id) return;
    if (activeTab === "mobileWallet") {
      await deactivateWallet({ variables: { id: deleteRow.id } });
    }
    if (activeTab === "paymentLink") {
      await deactivateLink({ variables: { id: deleteRow.id } });
    }
    if (activeTab === "onlineAccount") {
      await deactivateAccount({ variables: { id: deleteRow.id } });
    }
    setDeleteRow(null);
    await refetchActive();
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
        isLoading={isDeleting}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleConfirmDelete}
      />
    </RequirePermission>
  );
}
