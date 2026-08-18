"use client";

import { Box, CircularProgress, type SxProps, type Theme, Typography } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui/filter/paginationControls.mobile";
import { Translation, useAppTranslation } from "@/shared/locale";

const DEFAULT_CLIENT_PAGE_SIZE = 10;

export interface MobileCardListProps<T> {
  readonly rows: readonly T[];
  readonly renderItem: (row: T, index: number) => ReactNode;
  readonly getKey: (row: T) => string;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly renderSkeleton?: () => ReactNode;
  readonly renderEmptyState?: (emptyMessage: string) => ReactNode;
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

type SxArrayElement = boolean | SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);

function isSxArray(sx: SxProps<Theme> | undefined): sx is ReadonlyArray<SxArrayElement> {
  return Array.isArray(sx);
}

function normalizeSx(sx: SxProps<Theme> | undefined): SxArrayElement[] {
  if (isSxArray(sx)) {
    return [...sx];
  }
  if (sx) {
    return [sx];
  }
  return [];
}

export function MobileCardList<T>({
  rows,
  renderItem,
  getKey,
  loading,
  emptyMessage,
  renderSkeleton,
  renderEmptyState,
  gap = 2,
  layout = "edge-to-edge",
  paginationOptions,
  sx,
}: MobileCardListProps<T>) {
  const commonLabels = useAppTranslation(Translation.Common);
  const resolvedEmptyMessage = emptyMessage ?? commonLabels.noEntriesFound;
  const isEdgeToEdge = layout === "edge-to-edge";
  const sxArray = normalizeSx(sx);
  const baseSx: SystemStyleObject<Theme> = {
    display: "flex",
    flexDirection: "column",
    gap,
    ...(isEdgeToEdge ? {} : { px: { xs: 2 } }),
  };
  const listSx: SxProps<Theme> = [baseSx, ...sxArray];
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
      <Box component="output" aria-busy="true" sx={listSx}>
        {renderSkeleton ? (
          renderSkeleton()
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {paginationControls}
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={listSx}>
        {renderEmptyState ? (
          renderEmptyState(resolvedEmptyMessage)
        ) : (
          <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {resolvedEmptyMessage}
            </Typography>
          </Box>
        )}
        {paginationControls}
      </Box>
    );
  }

  return (
    <Box sx={listSx}>
      {visibleRows.map((row, index) => (
        <Box key={getKey(row)}>{renderItem(row, index)}</Box>
      ))}
      {paginationControls}
    </Box>
  );
}
