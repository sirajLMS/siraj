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
} from "@/frontend/desktop/components/ui";
import { useAppLocale } from "@/shared/locale";

export function SupportedCurrenciesDesktopView({
  rows,
  loading,
  emptyMessage,
  footerNote,
  pageTitle,
  pageSubtitle,
  flagColumnLabel,
  codeColumnLabel,
  symbolColumnLabel,
  nameColumnLabel,
  countryColumnLabel,
  activeColumnLabel,
  actionsColumnLabel,
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

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
  const columns = useMemo<GridColDef<SupportedCurrencyRow>[]>(
    () =>
      buildSupportedCurrencyColumns(
        {
          flagColumnLabel,
          codeColumnLabel,
          symbolColumnLabel,
          nameColumnLabel,
          countryColumnLabel,
          activeColumnLabel,
          actionsColumnLabel,
          editLabel,
          deactivateLabel,
        },
        { onEdit, onDeactivate },
        canManage,
        locale
      ),
    [
      flagColumnLabel,
      codeColumnLabel,
      symbolColumnLabel,
      nameColumnLabel,
      countryColumnLabel,
      activeColumnLabel,
      actionsColumnLabel,
      editLabel,
      deactivateLabel,
      locale,
      onEdit,
      onDeactivate,
      canManage,
    ]
  );

  const activateDialogProps: SupportedCurrencyActivateDialogProps = {
    open: activateOpen,
    row: editRow,
    onClose: () => {
      setActivateOpen(false);
      setEditRow(null);
    },
    onSaved: handleSaved,
  };

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          canManage ? (
            <DesktopPrimaryPageAction onClick={onActivate} startIcon={<AddOutlined />}>
              {activateLabel}
            </DesktopPrimaryPageAction>
          ) : null
        }
      />
      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={emptyMessage}
        getRowId={row => row.id}
        autoHeight
        paginationOptions={{ mode: "client" }}
      />
      <Alert severity="info" sx={{ mt: 2 }}>
        {footerNote}
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
