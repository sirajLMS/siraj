"use client";

import { AddOutlined, EditOutlined, ToggleOffOutlined } from "@mui/icons-material";
import { Alert, Box, IconButton, Stack } from "@mui/material";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale";
import {
  SupportedCurrencyActivateDialog,
  type SupportedCurrencyActivateDialogProps,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog";
import { SupportedCurrencyDeactivateDialog } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyDeactivateDialog";
import type {
  SupportedCurrenciesViewModel,
  SupportedCurrencyRow,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui";
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
  rows,
  loading,
  emptyMessage,
  footerNote,
  pageTitle,
  pageSubtitle,
  activateLabel,
  editLabel,
  deactivateLabel,
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

  const activateDialogProps: SupportedCurrencyActivateDialogProps = {
    open: activateOpen,
    row: editRow,
    onClose: () => {
      setActivateOpen(false);
      setEditRow(null);
    },
    onSaved: handleSaved,
    // Exclude already-activated currencies so the selector only offers
    // currencies not yet in the supported_currencies table. The edited row's
    // own code is kept visible by the autocomplete (edit field is disabled).
    excludedCodes: rows.filter(row => row.isActive).map(row => row.code),
  };

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        edgeToEdge={false}
        actions={
          canManage ? (
            <MobilePrimaryPageAction onClick={onActivate} startIcon={<AddOutlined />}>
              {activateLabel}
            </MobilePrimaryPageAction>
          ) : null
        }
      />
      <Box sx={{ px: { xs: 2, md: 0 }, pb: 2 }}>
        <MobileCardList
          rows={rows}
          loading={loading}
          emptyMessage={emptyMessage}
          getKey={row => row.id}
          paginationOptions={{ mode: "client" }}
          layout="edge-to-edge"
          renderItem={row => (
            <SupportedCurrencyCard
              row={row}
              locale={locale}
              canManage={canManage}
              editLabel={editLabel}
              deactivateLabel={deactivateLabel}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          )}
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          {footerNote}
        </Alert>
      </Box>

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
    </MobilePageContainer>
  );
}
