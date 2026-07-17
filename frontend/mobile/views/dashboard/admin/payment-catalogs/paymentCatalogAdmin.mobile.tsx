"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";
import type { PaymentCatalogAdminViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/paymentCatalogAdminView";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { PaymentCatalogCardMobile } from "@/frontend/mobile/views/dashboard/admin/payment-catalogs/components/paymentCatalogCard.mobile";
import { useAppTranslation } from "@/shared/locale";

export function PaymentCatalogAdminMobileView({
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
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} edgeToEdge={false} actions={null} />
      <MobileContentStack gap={3} paddingBottom={4}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <MobileAddButton label={t.addEntry} onClick={onAdd} />
        </Box>
        <Tabs value={activeTab} onChange={(_event, value) => onTabChange(value)} variant="fullWidth">
          <Tab value="mobileWallet" label={t.tabs.mobileWallets} />
          <Tab value="paymentLink" label={t.tabs.paymentLinks} />
          <Tab value="onlineAccount" label={t.tabs.onlineAccounts} />
        </Tabs>

        {activeTab === "mobileWallet" && !loading ? (
          <Box>
            {mobileWallets.map(row =>
              row?.id ? <PaymentCatalogCardMobile key={row.id} row={row} onEdit={onEdit} onDelete={onDelete} /> : null
            )}
          </Box>
        ) : null}
        {activeTab === "paymentLink" && !loading ? (
          <Box>
            {paymentLinks.map(row =>
              row?.id ? <PaymentCatalogCardMobile key={row.id} row={row} onEdit={onEdit} onDelete={onDelete} /> : null
            )}
          </Box>
        ) : null}
        {activeTab === "onlineAccount" && !loading ? (
          <Box>
            {onlineAccounts.map(row =>
              row?.id ? <PaymentCatalogCardMobile key={row.id} row={row} onEdit={onEdit} onDelete={onDelete} /> : null
            )}
          </Box>
        ) : null}
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
