"use client";

import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui/filter/paginationControls.mobile";

/**
 * Renders owned mobile list pagination from `ListPaginationOptions`.
 * Always visible when `paginationOptions !== false` (even single page).
 * Prefer `MobileCardList` for new lists — this helper is for transitional feature lists.
 */
export function MobileListPagination({ paginationOptions }: Readonly<{ paginationOptions: ListPaginationOptions }>) {
  if (paginationOptions === false) {
    return null;
  }

  if (paginationOptions.mode === "client") {
    return null;
  }

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
