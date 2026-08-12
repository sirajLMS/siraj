"use client";

import { AddOutlined, EditOutlined, ToggleOffOutlined } from "@mui/icons-material";
import { Alert, Box, IconButton, Stack } from "@mui/material";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import { BillingMobileListShellShared } from "@/frontend/common/views/dashboard/admin/billing/__shared__/billingMobileListShellShared";
import {
  SupportedCurrencyActivateDialog,
  type SupportedCurrencyActivateDialogProps,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog";
import { SupportedCurrencyDeactivateDialog } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyDeactivateDialog";
import type {
  SupportedCurrenciesViewModel,
  SupportedCurrencyRow,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import { MobileCardListItem, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { useAppLocale } from "@/shared/locale";

function SupportedCurrencyCard({
  row,
  locale,
  canManage,
  editLabel,
  deactivateLabel,
  onEdit,
  onDeactivate,
}: Readonly<{
  readonly row: SupportedCurrencyRow;
  readonly locale: string;
  readonly canManage: boolean;
  readonly editLabel: string;
  readonly deactivateLabel: string;
  readonly onEdit: (row: SupportedCurrencyRow) => void;
  readonly onDeactivate: (row: SupportedCurrencyRow) => void;
}>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box component="span" sx={{ fontSize: 24 }} aria-hidden>
            {row.flagEmoji}
          </Box>
          <Box>
            <Box sx={{ fontWeight: 700 }}>{row.code}</Box>
            <Box sx={theme => ({ color: theme.palette.text.secondary })}>{row.symbol}</Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ textAlign: "right" }}>
            <Box>{getCurrencyDisplayName(row.code, locale)}</Box>
            <Box sx={theme => ({ color: theme.palette.text.secondary })}>
              {getCountryDisplayName(row.countryCode, locale)}
            </Box>
          </Box>
          {canManage ? (
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" aria-label={editLabel} onClick={() => onEdit(row)}>
                <EditOutlined fontSize="small" />
              </IconButton>
              {row.isActive ? (
                <IconButton size="small" aria-label={deactivateLabel} onClick={() => onDeactivate(row)}>
                  <ToggleOffOutlined fontSize="small" />
                </IconButton>
              ) : null}
            </Stack>
          ) : null}
        </Box>
      </Box>
    </MobileCardListItem>
  );
}

export function SupportedCurrenciesMobileView({
  labelsBySection,
  rows,
  loading,
  canManage,
  onActivate,
  onEdit,
  onDeactivate,
  activateOpen,
  editRow,
  deactivateRow,
  isDeactivating,
  setActivateOpen,
  setEditRow,
  setDeactivateRow,
  handleSaved,
  handleConfirmDeactivate,
}: Readonly<SupportedCurrenciesViewModel>) {
  const locale = useAppLocale();
  const { shell, actions } = labelsBySection;

  const activateDialogProps: SupportedCurrencyActivateDialogProps = {
    open: activateOpen,
    row: editRow,
    onClose: () => {
      setActivateOpen(false);
      setEditRow(null);
    },
    onSaved: handleSaved,
    excludedCodes: rows.filter(row => row.isActive).map(row => row.code),
  };

  return (
    <>
      <BillingMobileListShellShared<SupportedCurrencyRow>
        pageTitle={shell.pageTitle}
        pageSubtitle={shell.pageSubtitle}
        actions={
          canManage ? (
            <MobilePrimaryPageAction onClick={onActivate} startIcon={<AddOutlined />}>
              {actions.activateLabel}
            </MobilePrimaryPageAction>
          ) : null
        }
        rows={rows}
        loading={loading}
        emptyMessage={shell.empty}
        getKey={row => row.id}
        renderItem={row => (
          <SupportedCurrencyCard
            row={row}
            locale={locale}
            canManage={canManage}
            editLabel={actions.editLabel}
            deactivateLabel={actions.deactivateLabel}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
          />
        )}
        footer={
          <Alert severity="info" sx={{ mt: 2 }}>
            {shell.footerNote}
          </Alert>
        }
      />
      {canManage ? (
        <>
          <SupportedCurrencyActivateDialog {...activateDialogProps} />
          <SupportedCurrencyDeactivateDialog
            open={deactivateRow != null}
            row={deactivateRow}
            isLoading={isDeactivating}
            onClose={() => setDeactivateRow(null)}
            onConfirm={handleConfirmDeactivate}
          />
        </>
      ) : null}
    </>
  );
}
