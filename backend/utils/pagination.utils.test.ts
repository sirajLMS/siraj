import { describe, expect, test } from "bun:test";
import { PaginationArgs } from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";

interface PageInfoTestCase {
  name: string;
  args: PaginationArgs | null | undefined;
  count: number;
  total: number;
  expected: ReturnType<typeof PaginationUtils.buildPageInfoFromArgs>;
}

const paginationCases: PageInfoTestCase[] = [
  {
    name: "calculates PageInfo correctly for the first page with more pages remaining",
    args: new PaginationArgs({ page: 1, first: 10 }),
    count: 10,
    total: 25,
    expected: {
      count: 10,
      currentPage: 1,
      firstItem: 1,
      hasMorePages: true,
      lastItem: 10,
      lastPage: 3,
      perPage: 10,
      total: 25,
    },
  },
  {
    name: "calculates PageInfo correctly for a middle page",
    args: new PaginationArgs({ page: 2, first: 10 }),
    count: 10,
    total: 25,
    expected: {
      count: 10,
      currentPage: 2,
      firstItem: 11,
      hasMorePages: true,
      lastItem: 20,
      lastPage: 3,
      perPage: 10,
      total: 25,
    },
  },
  {
    name: "calculates PageInfo correctly for the last page with partial count",
    args: new PaginationArgs({ page: 3, first: 10 }),
    count: 5,
    total: 25,
    expected: {
      count: 5,
      currentPage: 3,
      firstItem: 21,
      hasMorePages: false,
      lastItem: 25,
      lastPage: 3,
      perPage: 10,
      total: 25,
    },
  },
  {
    name: "calculates lastPage correctly when total is an exact multiple of perPage",
    args: new PaginationArgs({ page: 2, first: 10 }),
    count: 10,
    total: 20,
    expected: {
      count: 10,
      currentPage: 2,
      firstItem: 11,
      hasMorePages: false,
      lastItem: 20,
      lastPage: 2,
      perPage: 10,
      total: 20,
    },
  },
  {
    name: "handles empty result set (total = 0, count = 0)",
    args: new PaginationArgs({ page: 1, first: 10 }),
    count: 0,
    total: 0,
    expected: {
      count: 0,
      currentPage: 1,
      firstItem: null,
      hasMorePages: false,
      lastItem: null,
      lastPage: 1,
      perPage: 10,
      total: 0,
    },
  },
  {
    name: "returns single page info when args is null and count > 0",
    args: null,
    count: 15,
    total: 15,
    expected: {
      count: 15,
      currentPage: 1,
      firstItem: 1,
      hasMorePages: false,
      lastItem: 15,
      lastPage: 1,
      perPage: 15,
      total: 15,
    },
  },
  {
    name: "returns empty page info when args is undefined and count = 0",
    args: undefined,
    count: 0,
    total: 0,
    expected: {
      count: 0,
      currentPage: 1,
      firstItem: null,
      hasMorePages: false,
      lastItem: null,
      lastPage: 1,
      perPage: 0,
      total: 0,
    },
  },
];

describe("PaginationUtils.buildPageInfoFromArgs", () => {
  test.each(paginationCases)("$name", ({ args, count, total, expected }) => {
    const result = PaginationUtils.buildPageInfoFromArgs(args, count, total);
    expect(result).toEqual(expected);
  });
});
