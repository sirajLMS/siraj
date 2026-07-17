"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { getCurrencyDisplayName } from "@/frontend/common/lib/currency";
import type {
  CurrencyHedgesViewModel,
  HedgeRow,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesView";
import {
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui";
import { useAppLocale } from "@/shared/locale";

function formatTimestamp(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString(locale);
}

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

  const columns = useMemo<GridColDef<HedgeRow>[]>(
    () => [
      {
        field: "currency",
        headerName: currencyColumnLabel,
        flex: 1,
        minWidth: 120,
        valueFormatter: value => getCurrencyDisplayName(String(value), locale),
      },
      { field: "amount", headerName: amountColumnLabel, flex: 1, minWidth: 120 },
      { field: "hedgeType", headerName: hedgeTypeColumnLabel, flex: 1, minWidth: 140 },
      { field: "notes", headerName: notesColumnLabel, flex: 1.5, minWidth: 180 },
      {
        field: "updatedAt",
        headerName: updatedAtColumnLabel,
        flex: 1,
        minWidth: 160,
        valueFormatter: value => formatTimestamp(String(value), locale),
      },
      {
        field: "actions",
        headerName: actionsColumnLabel,
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label={editHedgeLabel} onClick={() => onEdit(row)}>
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={deleteHedgeLabel} onClick={() => onDelete(row)}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
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
        />
      </Box>
    </DesktopPageContainer>
  );
}
