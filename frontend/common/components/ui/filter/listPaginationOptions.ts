/**
 * Shared pagination config for list primitives (`*AppDataGrid`, `MobileCardList`).
 * Callers pass this object only — never pagination UI components.
 */
export type ListPaginationOptions =
  | false
  | {
      readonly mode: "client";
      readonly pageSize?: number;
      readonly pageSizeOptions?: readonly number[];
    }
  | {
      readonly mode: "server";
      readonly page: number;
      readonly pageSize: number;
      readonly totalCount: number;
      readonly onPageChange: (page: number) => void;
      readonly onPageSizeChange?: (pageSize: number) => void;
      readonly pageSizeOptions?: readonly number[];
    };

export type ServerListPaginationOptions = Extract<ListPaginationOptions, { mode: "server" }>;
export type ClientListPaginationOptions = Extract<ListPaginationOptions, { mode: "client" }>;

export function buildServerPaginationOptions(args: {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange?: (pageSize: number) => void;
  readonly pageSizeOptions?: readonly number[];
}): ServerListPaginationOptions {
  return {
    mode: "server",
    page: args.page,
    pageSize: args.pageSize,
    totalCount: args.totalCount,
    onPageChange: args.onPageChange,
    ...(args.onPageSizeChange !== undefined ? { onPageSizeChange: args.onPageSizeChange } : {}),
    ...(args.pageSizeOptions !== undefined ? { pageSizeOptions: args.pageSizeOptions } : {}),
  };
}
