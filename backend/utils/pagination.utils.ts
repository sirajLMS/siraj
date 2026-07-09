import type { PageInfo, PaginationArgs } from "@/backend/types";

export namespace PaginationUtils {
  /**
   * Builds a PageInfo object from PaginationArgs, count, and total.
   * Equivalent to Kotlin's paginationArgsToInfo.
   */
  export function buildPageInfoFromArgs(
    args: PaginationArgs | null | undefined,
    count: number,
    total: number
  ): PageInfo {
    if (args) {
      const lastPage = total > 0 ? Math.floor((total - 1) / args.perPage) + 1 : 1;
      const firstItem = count > 0 ? args.offset + 1 : null;
      const lastItem = count > 0 ? args.offset + count : null;
      return {
        count,
        currentPage: args.currentPage,
        firstItem,
        hasMorePages: args.currentPage < lastPage,
        lastItem,
        lastPage,
        perPage: args.perPage,
        total,
      };
    } else {
      return {
        count,
        currentPage: 1,
        firstItem: count > 0 ? 1 : null,
        hasMorePages: false,
        lastItem: count > 0 ? count : null,
        lastPage: 1,
        perPage: count,
        total,
      };
    }
  }
}
