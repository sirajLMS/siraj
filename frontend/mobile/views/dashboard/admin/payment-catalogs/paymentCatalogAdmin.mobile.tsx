"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";
import type { PaymentCatalogAdminViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
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
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} actions={null} />
      <MobileContentStack gap={3} paddingBottom={4}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <MobileAddButton label={labels.addEntry} onClick={onAdd} />
        </Box>
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

function MobileAddButton({ label, onClick }: Readonly<{ readonly label: string; readonly onClick: () => void }>) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={theme => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
        border: "none",
        borderRadius: theme.layout.radius.card,
        px: 2,
        py: 1,
        cursor: "pointer",
        font: "inherit",
        fontWeight: 700,
      })}
    >
      <AddOutlined fontSize="small" />
      {label}
    </Box>
  );
}
