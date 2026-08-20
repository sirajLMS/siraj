import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { type PageInfo, PaginationArgsDefault, type PaginationInput } from "@/backend/types";

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

export { PaginationArgsDefault };

const PaginationArgsRef = gqlSchemaBuilder.inputRef<PaginationInput>("PaginationArgs");

export const PaginationArgsObject = PaginationArgsRef.implement({
  fields: t => ({
    first: t.int({ defaultValue: PaginationArgsDefault.first, directives: { constraint: { min: 1, max: 200 } } }),
    skip: t.int({ directives: { constraint: { min: 0 } } }),
    after: t.string(),
    before: t.string(),
    last: t.int({ directives: { constraint: { min: 1, max: 200 } } }),
    page: t.int({ directives: { constraint: { min: 1 } } }),
    maxCount: t.int({ defaultValue: PaginationArgsDefault.maxCount, directives: { constraint: { min: 1, max: 500 } } }),
  }),
});
