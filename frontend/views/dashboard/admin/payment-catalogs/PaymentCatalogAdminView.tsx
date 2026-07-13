"use client";

import { AddOutlined } from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import { MobileWalletCatalogGrid } from "@/frontend/views/dashboard/admin/payment-catalogs/components/MobileWalletCatalogGrid";
import { OnlineAccountCatalogGrid } from "@/frontend/views/dashboard/admin/payment-catalogs/components/OnlineAccountCatalogGrid";
import { PaymentLinkCatalogGrid } from "@/frontend/views/dashboard/admin/payment-catalogs/components/PaymentLinkCatalogGrid";
import type { PaymentCatalogKind, PaymentCatalogRow } from "@/frontend/views/dashboard/admin/payment-catalogs/types";

export interface PaymentCatalogAdminViewProps {
  readonly activeTab: PaymentCatalogKind;
  readonly onTabChange: (tab: PaymentCatalogKind) => void;
  readonly mobileWallets: readonly SupportedMobileWalletFieldsFragment[];
  readonly paymentLinks: readonly SupportedPaymentLinkFieldsFragment[];
  readonly onlineAccounts: readonly SupportedOnlineAccountFieldsFragment[];
  readonly loading?: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (row: PaymentCatalogRow) => void;
  readonly onDelete: (row: PaymentCatalogRow) => void;
}

export function PaymentCatalogAdminView({
  activeTab,
  onTabChange,
  mobileWallets,
  paymentLinks,
  onlineAccounts,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}: Readonly<PaymentCatalogAdminViewProps>) {
  const t = useTranslations("dashboard.paymentCatalogs");

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        actions={
          <PrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {t("addEntry")}
          </PrimaryPageAction>
        }
      />

      <Tabs value={activeTab} onChange={(_event, value: PaymentCatalogKind) => onTabChange(value)} sx={{ mb: 2 }}>
        <Tab value="mobileWallet" label={t("tabs.mobileWallets")} />
        <Tab value="paymentLink" label={t("tabs.paymentLinks")} />
        <Tab value="onlineAccount" label={t("tabs.onlineAccounts")} />
      </Tabs>

      {activeTab === "mobileWallet" ? (
        <MobileWalletCatalogGrid rows={mobileWallets} loading={loading} onEdit={onEdit} onDelete={onDelete} />
      ) : null}
      {activeTab === "paymentLink" ? (
        <PaymentLinkCatalogGrid rows={paymentLinks} loading={loading} onEdit={onEdit} onDelete={onDelete} />
      ) : null}
      {activeTab === "onlineAccount" ? (
        <OnlineAccountCatalogGrid rows={onlineAccounts} loading={loading} onEdit={onEdit} onDelete={onDelete} />
      ) : null}
    </PageContainer>
  );
}
