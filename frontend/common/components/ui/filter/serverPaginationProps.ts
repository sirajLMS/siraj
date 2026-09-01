"use client";

import {
  buildServerPaginationOptions,
  type ServerListPaginationOptions,
} from "@/frontend/common/components/ui/filter/listPaginationOptions";

/**
 * Builds server `ListPaginationOptions` when totalCount + onPageChange are present.
 * Returns `false` when server pagination is not active (caller may use client mode instead).
 */
export function getServerPaginationOptions(
  config: { readonly page: number; readonly pageSize: number },
  totalCount: number | undefined,
  onPageChange: ((page: number) => void) | undefined
): ServerListPaginationOptions | false {
  let result: ServerListPaginationOptions | false = false;
  if (totalCount !== undefined && onPageChange !== undefined) {
    result = buildServerPaginationOptions({
      page: config.page,
      pageSize: config.pageSize,
      totalCount,
      onPageChange,
    });
  }
  return result;
}
