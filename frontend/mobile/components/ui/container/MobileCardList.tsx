"use client";

import { Box, CircularProgress, type SxProps, type Theme, Typography } from "@mui/material";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui/filter/paginationControls.mobile";

const DEFAULT_CLIENT_PAGE_SIZE = 10;

export interface MobileCardListProps<T> {
  readonly rows: readonly T[];
  readonly renderItem: (row: T, index: number) => ReactNode;
  readonly getKey: (row: T) => string;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly gap?: number;
  readonly layout?: "edge-to-edge" | "rounded";
  readonly paginationOptions: ListPaginationOptions;
  readonly sx?: SxProps<Theme>;
}

function buildPaginationControls(
  paginationOptions: ListPaginationOptions,
  rowsLength: number,
  clientPage: number,
  clientPageSize: number,
  setClientPage: (page: number) => void
) {
  if (paginationOptions === false) {
    return null;
  }

  if (paginationOptions.mode === "server") {
    const pageCount = Math.max(1, Math.ceil(paginationOptions.totalCount / paginationOptions.pageSize) || 1);
    return (
      <MobilePaginationControls
        embedded
        page={paginationOptions.page}
        pageCount={pageCount}
        rowCount={paginationOptions.totalCount}
        pageSize={paginationOptions.pageSize}
        onPageChange={paginationOptions.onPageChange}
      />
    );
  }

  const pageCount = Math.max(1, Math.ceil(rowsLength / clientPageSize) || 1);
  return (
    <MobilePaginationControls
      embedded
      page={clientPage}
      pageCount={pageCount}
      rowCount={rowsLength}
      pageSize={clientPageSize}
      onPageChange={setClientPage}
    />
  );
}

export function MobileCardList<T>({
  rows,
  renderItem,
  getKey,
  loading,
  emptyMessage = "No entries found",
  gap = 2,
  layout = "edge-to-edge",
  paginationOptions,
  sx,
}: MobileCardListProps<T>) {
  const isEdgeToEdge = layout === "edge-to-edge";
  const clientPageSize =
    paginationOptions !== false && paginationOptions.mode === "client"
      ? (paginationOptions.pageSize ?? DEFAULT_CLIENT_PAGE_SIZE)
      : DEFAULT_CLIENT_PAGE_SIZE;

  const [clientPage, setClientPage] = useState(0);

  useEffect(() => {
    if (paginationOptions === false || paginationOptions.mode !== "client") {
      return;
    }
    const pageCount = Math.max(1, Math.ceil(rows.length / clientPageSize) || 1);
    if (clientPage >= pageCount) {
      setClientPage(Math.max(0, pageCount - 1));
    }
  }, [clientPage, clientPageSize, paginationOptions, rows.length]);

  const visibleRows = useMemo(() => {
    if (paginationOptions === false || paginationOptions.mode === "server") {
      return rows;
    }
    const start = clientPage * clientPageSize;
    return rows.slice(start, start + clientPageSize);
  }, [clientPage, clientPageSize, paginationOptions, rows]);

  const paginationControls = buildPaginationControls(
    paginationOptions,
    rows.length,
    clientPage,
    clientPageSize,
    setClientPage
  );

  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap, ...(isEdgeToEdge ? { px: { xs: 2 } } : {}), ...sx }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
          <CircularProgress />
        </Box>
        {paginationControls}
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap, ...(isEdgeToEdge ? { px: { xs: 2 } } : {}), ...sx }}>
        <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {emptyMessage}
          </Typography>
        </Box>
        {paginationControls}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap,
        ...(isEdgeToEdge ? { px: { xs: 2 } } : {}),
        ...sx,
      }}
    >
      {visibleRows.map((row, index) => (
        <Box key={getKey(row)}>{renderItem(row, index)}</Box>
      ))}
      {paginationControls}
    </Box>
  );
}
