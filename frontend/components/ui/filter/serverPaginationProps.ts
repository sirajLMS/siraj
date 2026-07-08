"use client";

import type { GridPaginationModel } from "@mui/x-data-grid";
import { GridPagination } from "./PaginationControls";

export interface ServerPaginationConfig {
  readonly page: number;
  readonly pageSize: number;
}

export interface ServerPaginationProps {
  readonly paginationMode: "server";
  readonly rowCount: number;
  readonly paginationModel: ServerPaginationConfig;
  readonly onPaginationModelChange: (model: GridPaginationModel) => void;
  readonly pageSizeOptions: number[];
  readonly slots: { pagination: typeof GridPagination };
}

export function getServerPaginationProps(
  config: ServerPaginationConfig,
  totalCount: number | undefined,
  onPageChange: ((page: number) => void) | undefined
): Partial<ServerPaginationProps> {
  if (totalCount === undefined || onPageChange === undefined) {
    return {};
  }

  return {
    paginationMode: "server",
    rowCount: totalCount,
    paginationModel: { page: config.page, pageSize: config.pageSize },
    onPaginationModelChange: model => {
      onPageChange(model.page);
    },
    pageSizeOptions: [config.pageSize],
    slots: { pagination: GridPagination },
  };
}

export function isServerPagination(
  totalCount: number | undefined,
  onPageChange: ((page: number) => void) | undefined
): boolean {
  return totalCount !== undefined && onPageChange !== undefined;
}
