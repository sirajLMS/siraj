"use client";

import { AddOutlined } from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import type { PaymentCatalogAdminViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/paymentCatalogAdminView";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { MobileWalletCatalogGridDesktop } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/mobileWalletCatalogGrid.desktop";
import { OnlineAccountCatalogGridDesktop } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/onlineAccountCatalogGrid.desktop";
import { PaymentLinkCatalogGridDesktop } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/paymentLinkCatalogGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export function PaymentCatalogAdminDesktopView({
  activeTab,
  onTabChange,
  mobileWallets,
  paymentLinks,
  onlineAccounts,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}: Readonly<PaymentCatalogAdminViewModel>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <PrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {t.addEntry}
          </PrimaryPageAction>
        }
      />

      <Tabs value={activeTab} onChange={(_event, value) => onTabChange(value)} sx={{ mb: 2 }}>
        <Tab value="mobileWallet" label={t.tabs.mobileWallets} />
        <Tab value="paymentLink" label={t.tabs.paymentLinks} />
        <Tab value="onlineAccount" label={t.tabs.onlineAccounts} />
      </Tabs>

      {activeTab === "mobileWallet" ? (
        <MobileWalletCatalogGridDesktop rows={mobileWallets} loading={loading} onEdit={onEdit} onDelete={onDelete} />
      ) : null}
      {activeTab === "paymentLink" ? (
        <PaymentLinkCatalogGridDesktop rows={paymentLinks} loading={loading} onEdit={onEdit} onDelete={onDelete} />
      ) : null}
      {activeTab === "onlineAccount" ? (
        <OnlineAccountCatalogGridDesktop rows={onlineAccounts} loading={loading} onEdit={onEdit} onDelete={onDelete} />
      ) : null}
    </DesktopPageContainer>
  );
}
