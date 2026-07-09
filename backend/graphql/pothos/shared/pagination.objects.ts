import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { PageInfo, PaginationInput } from "@/backend/types";

const PageInfoRef = gqlSchemaBuilder.objectRef<PageInfo>("PageInfo");

export const PageInfoObject = PageInfoRef.implement({
  fields: t => ({
    count: t.exposeInt("count", { nullable: false }),
    currentPage: t.exposeInt("currentPage", { nullable: false }),
    firstItem: t.exposeInt("firstItem", { nullable: true }),
    lastItem: t.exposeInt("lastItem", { nullable: true }),
    hasMorePages: t.exposeBoolean("hasMorePages", { nullable: false }),
    lastPage: t.exposeInt("lastPage", { nullable: false }),
    perPage: t.exposeInt("perPage", { nullable: false }),
    total: t.exposeInt("total", { nullable: false }),
    startCursor: t.exposeString("startCursor", { nullable: true }),
    endCursor: t.exposeString("endCursor", { nullable: true }),
  }),
});

export const PaginationArgsDefault = {
  first: 10,
  maxCount: 100,
};

const PaginationArgsRef = gqlSchemaBuilder.inputRef<PaginationInput>("PaginationArgs");

export const PaginationArgsObject = PaginationArgsRef.implement({
  fields: t => ({
    first: t.int({ defaultValue: PaginationArgsDefault.first }),
    skip: t.int(),
    after: t.string(),
    before: t.string(),
    last: t.int(),
    page: t.int(),
    maxCount: t.int({ defaultValue: PaginationArgsDefault.maxCount }),
  }),
});
