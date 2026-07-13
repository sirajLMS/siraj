"use client";

import {
  Box,
  CircularProgress,
  Pagination as MuiPagination,
  type SxProps,
  type Theme,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

export interface PaginationConfig {
  readonly page: number;
  readonly pageCount: number;
  readonly rowCount: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

export interface MobileCardListProps<T> {
  readonly rows: readonly T[];
  readonly renderItem: (row: T, index: number) => ReactNode;
  readonly getKey: (row: T) => string;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly gap?: number;
  readonly layout?: "edge-to-edge" | "rounded";
  readonly pagination?: PaginationConfig;
  readonly sx?: SxProps<Theme>;
}

export function MobileCardList<T>({
  rows,
  renderItem,
  getKey,
  loading,
  emptyMessage = "No entries found",
  gap = 2,
  layout = "edge-to-edge",
  pagination,
  sx,
}: MobileCardListProps<T>) {
  const isEdgeToEdge = layout === "edge-to-edge";

  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {emptyMessage}
        </Typography>
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
      {rows.map((row, index) => (
        <Box key={getKey(row)}>{renderItem(row, index)}</Box>
      ))}

      {pagination && (
        <MuiPagination
          page={pagination.page}
          count={pagination.pageCount}
          onChange={(_e, page) => pagination.onPageChange(page)}
          color="primary"
          variant="outlined"
          shape="rounded"
          sx={{ mt: 2, "& .MuiPaginationItem-root": { borderRadius: 2 } }}
        />
      )}
    </Box>
  );
}
