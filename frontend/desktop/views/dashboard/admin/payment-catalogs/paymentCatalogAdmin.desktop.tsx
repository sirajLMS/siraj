"use client";

import { AddOutlined } from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import type { PaymentCatalogAdminViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { MobileWalletCatalogGridDesktop } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/mobileWalletCatalogGrid.desktop";
import { OnlineAccountCatalogGridDesktop } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/onlineAccountCatalogGrid.desktop";
import { PaymentLinkCatalogGridDesktop } from "@/frontend/desktop/views/dashboard/admin/payment-catalogs/components/paymentLinkCatalogGrid.desktop";

export function PaymentCatalogAdminDesktopView({
  labels,
  activeTab,
  onTabChange,
  mobileWallets,
  paymentLinks,
  onlineAccounts,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: Readonly<PaymentCatalogAdminViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <DesktopPrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {labels.addEntry}
          </DesktopPrimaryPageAction>
        }
      />

      <Tabs value={activeTab} onChange={(_event, value) => onTabChange(value)} sx={{ mb: 2 }}>
        <Tab value="mobileWallet" label={labels.tabs.mobileWallets} />
        <Tab value="paymentLink" label={labels.tabs.paymentLinks} />
        <Tab value="onlineAccount" label={labels.tabs.onlineAccounts} />
      </Tabs>

      {activeTab === "mobileWallet" ? (
        <MobileWalletCatalogGridDesktop
          labels={labels}
          rows={mobileWallets}
          loading={loading}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
      {activeTab === "paymentLink" ? (
        <PaymentLinkCatalogGridDesktop
          labels={labels}
          rows={paymentLinks}
          loading={loading}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
      {activeTab === "onlineAccount" ? (
        <OnlineAccountCatalogGridDesktop
          labels={labels}
          rows={onlineAccounts}
          loading={loading}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
    </DesktopPageContainer>
  );
}
