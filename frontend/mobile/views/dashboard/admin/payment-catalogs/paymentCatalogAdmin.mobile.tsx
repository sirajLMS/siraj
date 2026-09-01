"use client";

import { AddOutlined } from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";
import type { PaymentCatalogAdminViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui";
import { PaymentCatalogCardMobile } from "@/frontend/mobile/views/dashboard/admin/payment-catalogs/components/paymentCatalogCard.mobile";

export function PaymentCatalogAdminMobileView({
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
  const catalogRowsMap = {
    mobileWallet: mobileWallets,
    paymentLink: paymentLinks,
    onlineAccount: onlineAccounts,
  };
  const catalogRows = catalogRowsMap[activeTab];
  const rows = catalogRows.filter((row): row is (typeof catalogRows)[number] & { id: string } => Boolean(row?.id));

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        edgeToEdge={false}
        actions={
          <MobilePrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {labels.addEntry}
          </MobilePrimaryPageAction>
        }
      />
      <MobileContentStack gap={3} paddingBottom={4}>
        <Tabs value={activeTab} onChange={(_event, value) => onTabChange(value)} variant="fullWidth">
          <Tab value="mobileWallet" label={labels.tabs.mobileWallets} />
          <Tab value="paymentLink" label={labels.tabs.paymentLinks} />
          <Tab value="onlineAccount" label={labels.tabs.onlineAccounts} />
        </Tabs>

        <MobileCardList
          rows={rows}
          loading={loading}
          getKey={row => row.id}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={row => <PaymentCatalogCardMobile labels={labels} row={row} onEdit={onEdit} onDelete={onDelete} />}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
