import type { PaginationArgs } from "@/frontend/common/graphql/generated/gql/graphql";

export function buildPaginationVars(page: number, pageSize: number): PaginationArgs {
  return {
    after: null,
    before: null,
    first: pageSize,
    last: null,
    maxCount: null,
    page: null,
    skip: page * pageSize,
  };
}
