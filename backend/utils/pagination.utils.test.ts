import { describe, expect, test } from "bun:test";
import { PaginationArgs } from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";

describe("PaginationUtils.buildPageInfoFromArgs", () => {
  describe("when args is provided", () => {
    test("calculates PageInfo correctly for the first page with more pages remaining", () => {
      const args = new PaginationArgs({ page: 1, first: 10 });
      const result = PaginationUtils.buildPageInfoFromArgs(args, 10, 25);

      expect(result).toEqual({
        count: 10,
        currentPage: 1,
        firstItem: 1,
        hasMorePages: true,
        lastItem: 10,
        lastPage: 3,
        perPage: 10,
        total: 25,
      });
    });

    test("calculates PageInfo correctly for a middle page", () => {
      const args = new PaginationArgs({ page: 2, first: 10 });
      const result = PaginationUtils.buildPageInfoFromArgs(args, 10, 25);

      expect(result).toEqual({
        count: 10,
        currentPage: 2,
        firstItem: 11,
        hasMorePages: true,
        lastItem: 20,
        lastPage: 3,
        perPage: 10,
        total: 25,
      });
    });

    test("calculates PageInfo correctly for the last page with partial count", () => {
      const args = new PaginationArgs({ page: 3, first: 10 });
      const result = PaginationUtils.buildPageInfoFromArgs(args, 5, 25);

      expect(result).toEqual({
        count: 5,
        currentPage: 3,
        firstItem: 21,
        hasMorePages: false,
        lastItem: 25,
        lastPage: 3,
        perPage: 10,
        total: 25,
      });
    });

    test("calculates lastPage correctly when total is an exact multiple of perPage", () => {
      const args = new PaginationArgs({ page: 2, first: 10 });
      const result = PaginationUtils.buildPageInfoFromArgs(args, 10, 20);

      expect(result).toEqual({
        count: 10,
        currentPage: 2,
        firstItem: 11,
        hasMorePages: false,
        lastItem: 20,
        lastPage: 2,
        perPage: 10,
        total: 20,
      });
    });

    test("handles empty result set (total = 0, count = 0)", () => {
      const args = new PaginationArgs({ page: 1, first: 10 });
      const result = PaginationUtils.buildPageInfoFromArgs(args, 0, 0);

      expect(result).toEqual({
        count: 0,
        currentPage: 1,
        firstItem: null,
        hasMorePages: false,
        lastItem: null,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
    });
  });

  describe("when args is null or undefined", () => {
    test("returns single page info when args is null and count > 0", () => {
      const result = PaginationUtils.buildPageInfoFromArgs(null, 15, 15);

      expect(result).toEqual({
        count: 15,
        currentPage: 1,
        firstItem: 1,
        hasMorePages: false,
        lastItem: 15,
        lastPage: 1,
        perPage: 15,
        total: 15,
      });
    });

    test("returns empty page info when args is undefined and count = 0", () => {
      const result = PaginationUtils.buildPageInfoFromArgs(undefined, 0, 0);

      expect(result).toEqual({
        count: 0,
        currentPage: 1,
        firstItem: null,
        hasMorePages: false,
        lastItem: null,
        lastPage: 1,
        perPage: 0,
        total: 0,
      });
    });
  });
});
