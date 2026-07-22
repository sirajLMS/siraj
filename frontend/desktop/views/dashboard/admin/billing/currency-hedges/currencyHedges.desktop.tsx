"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";
import { buildCurrencyHedgeColumns } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/utils";
import {
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui";
import { useAppLocale } from "@/shared/locale";

export function CurrencyHedgesDesktopView({
  rows,
  loading,
  pageTitle,
  pageSubtitle,
  emptyMessage,
  addHedgeLabel,
  currencyColumnLabel,
  amountColumnLabel,
  hedgeTypeColumnLabel,
  notesColumnLabel,
  updatedAtColumnLabel,
  actionsColumnLabel,
  editHedgeLabel,
  deleteHedgeLabel,
  onEdit,
  onDelete,
  onAdd,
}: Readonly<CurrencyHedgesViewModel>) {
  const locale = useAppLocale();

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
  const columns = useMemo<readonly GridColDef<HedgeRow>[]>(
    () =>
      buildCurrencyHedgeColumns(
        {
          currencyColumnLabel,
          amountColumnLabel,
          hedgeTypeColumnLabel,
          notesColumnLabel,
          updatedAtColumnLabel,
          actionsColumnLabel,
          editHedgeLabel,
          deleteHedgeLabel,
        },
        { onEdit, onDelete },
        locale
      ),
    [
      currencyColumnLabel,
      amountColumnLabel,
      hedgeTypeColumnLabel,
      notesColumnLabel,
      updatedAtColumnLabel,
      actionsColumnLabel,
      editHedgeLabel,
      deleteHedgeLabel,
      locale,
      onEdit,
      onDelete,
    ]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={<DesktopPrimaryPageAction onClick={onAdd}>{addHedgeLabel}</DesktopPrimaryPageAction>}
      />
      <Box sx={{ height: 560 }}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          emptyMessage={emptyMessage}
          getRowId={row => row.id}
          paginationOptions={{ mode: "client" }}
        />
      </Box>
    </DesktopPageContainer>
  );
}
