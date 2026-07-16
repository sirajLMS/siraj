"use client";

import { AddOutlined } from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import { MobileWalletCatalogGrid } from "@/frontend/common/views/dashboard/admin/payment-catalogs/components/MobileWalletCatalogGrid";
import { OnlineAccountCatalogGrid } from "@/frontend/common/views/dashboard/admin/payment-catalogs/components/OnlineAccountCatalogGrid";
import { PaymentLinkCatalogGrid } from "@/frontend/common/views/dashboard/admin/payment-catalogs/components/PaymentLinkCatalogGrid";
import type {
  PaymentCatalogKind,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { useAppTranslation } from "@/shared/locale/client";

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
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;
  const pc = t;

  return (
    <PageContainer>
      <PageHeader
        title={pc.pageTitle}
        subtitle={pc.pageSubtitle}
        actions={
          <PrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {pc.addEntry}
          </PrimaryPageAction>
        }
      />

      <Tabs value={activeTab} onChange={(_event, value: PaymentCatalogKind) => onTabChange(value)} sx={{ mb: 2 }}>
        <Tab value="mobileWallet" label={pc.tabs.mobileWallets} />
        <Tab value="paymentLink" label={pc.tabs.paymentLinks} />
        <Tab value="onlineAccount" label={pc.tabs.onlineAccounts} />
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
