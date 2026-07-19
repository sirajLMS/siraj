"use client";

import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui/filter/paginationControls.mobile";

/**
 * Renders owned mobile list pagination from `ListPaginationOptions`.
 * Client-mode paging for feature lists that do not slice rows themselves
 * should use `MobileCardList` instead.
 */
export function MobileListPagination({
  paginationOptions,
}: Readonly<{ paginationOptions: ListPaginationOptions }>) {
  if (paginationOptions === false) {
    return null;
  }

  if (paginationOptions.mode === "client") {
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(paginationOptions.totalCount / paginationOptions.pageSize));
  if (paginationOptions.totalCount <= 0 || pageCount <= 1) {
    return null;
  }

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
