"use client";

import {
  buildServerPaginationOptions,
  type ListPaginationOptions,
  type ServerListPaginationOptions,
} from "@/frontend/common/components/ui/filter/listPaginationOptions";

export type { ListPaginationOptions, ServerListPaginationOptions };
export { buildServerPaginationOptions };

/** @deprecated Prefer `buildServerPaginationOptions` — returns list config, not MUI props. */
export interface ServerPaginationConfig {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Builds server `ListPaginationOptions` when totalCount + onPageChange are present.
 * Returns `false` when server pagination is not active (caller may use client mode instead).
 */
export function getServerPaginationOptions(
  config: ServerPaginationConfig,
  totalCount: number | undefined,
  onPageChange: ((page: number) => void) | undefined
): ServerListPaginationOptions | false {
  if (totalCount === undefined || onPageChange === undefined) {
    return false;
  }

  return buildServerPaginationOptions({
    page: config.page,
    pageSize: config.pageSize,
    totalCount,
    onPageChange,
  });
}

export function isServerPagination(
  totalCount: number | undefined,
  onPageChange: ((page: number) => void) | undefined
): boolean {
  return totalCount !== undefined && onPageChange !== undefined;
}

/** @deprecated Use `getServerPaginationOptions` */
export const getServerPaginationProps = getServerPaginationOptions;
