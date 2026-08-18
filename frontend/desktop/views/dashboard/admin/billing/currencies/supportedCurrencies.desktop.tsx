"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  SupportedCurrencyActivateDialog,
  type SupportedCurrencyActivateDialogProps,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog";
import { SupportedCurrencyDeactivateDialog } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyDeactivateDialog";
import type {
  SupportedCurrenciesViewModel,
  SupportedCurrencyRow,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import { buildSupportedCurrencyColumns } from "@/frontend/common/views/dashboard/admin/billing/currencies/utils";
import {
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { useAppLocale } from "@/shared/locale";

export function SupportedCurrenciesDesktopView({
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
  const { shell, columns, actions } = labelsBySection;

  const columnsWithActions = useMemo<GridColDef<SupportedCurrencyRow>[]>(
    () =>
      buildSupportedCurrencyColumns(
        { ...columns, editLabel: actions.editLabel, deactivateLabel: actions.deactivateLabel },
        { onEdit, onDeactivate },
        canManage,
        locale
      ),
    [actions.deactivateLabel, actions.editLabel, canManage, columns, locale, onDeactivate, onEdit]
  );

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
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.pageTitle}
        subtitle={shell.pageSubtitle}
        actions={
          canManage ? (
            <DesktopPrimaryPageAction onClick={onActivate} startIcon={<AddOutlined />}>
              {actions.activateLabel}
            </DesktopPrimaryPageAction>
          ) : null
        }
      />
      <DesktopSectionPanel contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columnsWithActions}
          loading={loading}
          emptyMessage={shell.empty}
          getRowId={row => row.id}
          autoHeight
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>
      <Alert severity="info" sx={{ mt: 2 }}>
        {shell.footerNote}
      </Alert>

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
    </DesktopPageContainer>
  );
}
