"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert } from "@mui/material";
import {
  SupportedCurrencyActivateDialog,
  type SupportedCurrencyActivateDialogProps,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog";
import { SupportedCurrencyDeactivateDialog } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyDeactivateDialog";
import type {
  SupportedCurrenciesViewModel,
  SupportedCurrencyRow,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import { MobileContentInset, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { BillingMobileListShellShared } from "@/frontend/mobile/views/dashboard/admin/billing/__shared__";
import { SupportedCurrencyCard } from "@/frontend/mobile/views/dashboard/admin/billing/currencies/supportedCurrencies.parts";
import { useAppLocale } from "@/shared/locale";

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
          <MobileContentInset>
            <Alert severity="info" sx={{ mt: 2 }}>
              {shell.footerNote}
            </Alert>
          </MobileContentInset>
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
