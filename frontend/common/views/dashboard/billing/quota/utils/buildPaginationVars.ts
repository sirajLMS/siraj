import type { PaginationArgs } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function buildPaginationVars(page: number, pageSize: number): PaginationArgs {
  return {
    skip: page * pageSize,
    first: pageSize,
  } as unknown as PaginationArgs;
}
