import type { PageInfo } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

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

type PaginationArgs = {
  first: number | null;
  skip: number | null;
  after: string | null;
  before: string | null;
  last: number | null;
  page: number | null;
  maxCount: number | null;
};

const PaginationArgsRef = gqlSchemaBuilder.inputRef<PaginationArgs>("PaginationArgs");

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
