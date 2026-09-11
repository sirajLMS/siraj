import { describe, expect, test } from "bun:test";
import { db } from "@/backend/db/drizzleDb";
import { students } from "@/backend/db/schema";
import { AppLanguage, Gender, OrderSortDirection } from "@/backend/enum";
import { StudentsOrderByColumn } from "@/backend/enum/students";
import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum";
import type * as Types from "@/backend/types";
import { StudentFilterUtils } from "@/backend/utils/student.filterUtils";

function createMockQb() {
  const whereClauses: unknown[] = [];
  const orderByExpressions: unknown[] = [];

  const mockQb = {
    where(clause: unknown) {
      whereClauses.push(clause);
      return mockQb;
    },
    orderBy(...exprs: unknown[]) {
      orderByExpressions.push(...exprs);
      return mockQb;
    },
    whereClauses,
    orderByExpressions,
  };

  return mockQb as unknown as Parameters<typeof StudentFilterUtils.applyFilters>[0];
}

describe("StudentFilterUtils", () => {
  describe("applyFilters", () => {
    test("returns qb unmodified when args is null, undefined, or empty object", () => {
      const qb1 = createMockQb();
      expect(StudentFilterUtils.applyFilters(qb1, null)).toBe(qb1);
      expect(qb1.whereClauses).toHaveLength(0);

      const qb2 = createMockQb();
      expect(StudentFilterUtils.applyFilters(qb2, undefined)).toBe(qb2);
      expect(qb2.whereClauses).toHaveLength(0);

      const qb3 = createMockQb();
      expect(StudentFilterUtils.applyFilters(qb3, {})).toBe(qb3);
      expect(qb3.whereClauses).toHaveLength(0);
    });

    test("applies individual name filters correctly", () => {
      // Test name (full text search)
      const qbName = createMockQb();
      StudentFilterUtils.applyFilters(qbName, { name: "John" });
      expect(qbName.whereClauses).toHaveLength(1);

      // Test nameNotContains with wildcards
      const qbNotContains = createMockQb();
      StudentFilterUtils.applyFilters(qbNotContains, { nameNotContains: "admin_%user" });
      expect(qbNotContains.whereClauses).toHaveLength(1);

      // Test nameEquals
      const qbEquals = createMockQb();
      StudentFilterUtils.applyFilters(qbEquals, { nameEquals: "Alice Smith" });
      expect(qbEquals.whereClauses).toHaveLength(1);

      // Test nameNotEquals
      const qbNotEquals = createMockQb();
      StudentFilterUtils.applyFilters(qbNotEquals, { nameNotEquals: "Bob Jones" });
      expect(qbNotEquals.whereClauses).toHaveLength(1);

      // Test nameStartsWith with wildcard escaping
      const qbStartsWith = createMockQb();
      StudentFilterUtils.applyFilters(qbStartsWith, { nameStartsWith: "Al_%_test" });
      expect(qbStartsWith.whereClauses).toHaveLength(1);

      // Test nameEndsWith with wildcard escaping
      const qbEndsWith = createMockQb();
      StudentFilterUtils.applyFilters(qbEndsWith, { nameEndsWith: "_smith%" });
      expect(qbEndsWith.whereClauses).toHaveLength(1);

      // Test nameIsEmpty
      const qbIsEmpty = createMockQb();
      StudentFilterUtils.applyFilters(qbIsEmpty, { nameIsEmpty: true });
      expect(qbIsEmpty.whereClauses).toHaveLength(1);

      // Test nameIsNotEmpty
      const qbIsNotEmpty = createMockQb();
      StudentFilterUtils.applyFilters(qbIsNotEmpty, { nameIsNotEmpty: true });
      expect(qbIsNotEmpty.whereClauses).toHaveLength(1);
    });

    test("applies other entity attribute filters individually", () => {
      const qbParent = createMockQb();
      StudentFilterUtils.applyFilters(qbParent, { parentId: "p-101" });
      expect(qbParent.whereClauses).toHaveLength(1);

      const qbTeacher = createMockQb();
      StudentFilterUtils.applyFilters(qbTeacher, { primaryTeacherId: "t-202" });
      expect(qbTeacher.whereClauses).toHaveLength(1);

      const qbGender = createMockQb();
      StudentFilterUtils.applyFilters(qbGender, { gender: Gender.FEMALE });
      expect(qbGender.whereClauses).toHaveLength(1);

      const qbLang = createMockQb();
      StudentFilterUtils.applyFilters(qbLang, { language: AppLanguage.ar });
      expect(qbLang.whereClauses).toHaveLength(1);

      const qbStatus = createMockQb();
      StudentFilterUtils.applyFilters(qbStatus, { status: StudentStatus.DEACTIVATED });
      expect(qbStatus.whereClauses).toHaveLength(1);
    });

    test("applies createdAt filters individually", () => {
      const date1 = new Date("2026-01-01T00:00:00Z");
      const date2 = new Date("2026-06-01T00:00:00Z");

      const filters: [keyof Types.StudentFilterArgs, unknown][] = [
        ["createdAt", date1],
        ["createdAtNot", date1],
        ["createdAtFrom", date1],
        ["createdAtTo", date2],
        ["createdAtAfter", date1],
        ["createdAtBefore", date2],
        ["createdAtOnOrAfter", date1],
        ["createdAtOnOrBefore", date2],
        ["createdAtIsEmpty", true],
        ["createdAtIsNotEmpty", true],
      ];

      for (const [key, value] of filters) {
        const qb = createMockQb();
        StudentFilterUtils.applyFilters(qb, { [key]: value });
        expect(qb.whereClauses).toHaveLength(1);
      }
    });

    test("applies birthDate filters individually", () => {
      const date1 = new Date("2012-03-15");
      const date2 = new Date("2018-09-20");

      const filters: [keyof Types.StudentFilterArgs, unknown][] = [
        ["birthDate", date1],
        ["birthDateNot", date1],
        ["birthDateFrom", date1],
        ["birthDateTo", date2],
        ["birthDateAfter", date1],
        ["birthDateBefore", date2],
        ["birthDateOnOrAfter", date1],
        ["birthDateOnOrBefore", date2],
        ["birthDateIsEmpty", true],
        ["birthDateIsNotEmpty", true],
      ];

      for (const [key, value] of filters) {
        const qb = createMockQb();
        StudentFilterUtils.applyFilters(qb, { [key]: value });
        expect(qb.whereClauses).toHaveLength(1);
      }
    });

    test("applies multi-field filter combination simultaneously", () => {
      const qb = createMockQb();
      const args: Types.StudentFilterArgs = {
        nameStartsWith: "Sam",
        parentId: "p-55",
        status: StudentStatus.REGULAR,
        gender: Gender.FEMALE,
        createdAtOnOrAfter: new Date("2026-01-01"),
        birthDateOnOrBefore: new Date("2015-01-01"),
      };

      StudentFilterUtils.applyFilters(qb, args);
      expect(qb.whereClauses).toHaveLength(6);
    });

    test("integrates cleanly with real Drizzle dynamic select query", () => {
      let query = db.select().from(students).$dynamic();

      query = StudentFilterUtils.applyFilters(query, {
        parentId: "parent-uuid-1",
      });

      const sqlObj = query.toSQL();
      expect(sqlObj.sql).toContain("where");
      expect(sqlObj.sql).toContain('"students"."parent_id" = $1');
    });
  });

  describe("applyOrdering", () => {
    test("applies default ordering by id ASC when orderBy is null, undefined, or empty", () => {
      const qb1 = createMockQb();
      StudentFilterUtils.applyOrdering(qb1, null);
      expect(qb1.orderByExpressions).toHaveLength(1);

      const qb2 = createMockQb();
      StudentFilterUtils.applyOrdering(qb2, undefined);
      expect(qb2.orderByExpressions).toHaveLength(1);

      const qb3 = createMockQb();
      StudentFilterUtils.applyOrdering(qb3, []);
      expect(qb3.orderByExpressions).toHaveLength(1);
    });

    test("applies single column ordering for all StudentsOrderByColumn enum values", () => {
      const allColumns = [
        StudentsOrderByColumn.ID,
        StudentsOrderByColumn.NAME,
        StudentsOrderByColumn.PARENT_ID,
        StudentsOrderByColumn.DATE_OF_BIRTH,
        StudentsOrderByColumn.GENDER,
        StudentsOrderByColumn.STATUS,
        StudentsOrderByColumn.CLASSES_TOTAL,
        StudentsOrderByColumn.CLASSES_REMAINING,
        StudentsOrderByColumn.CREATED_AT,
        StudentsOrderByColumn.UPDATED_AT,
      ];

      for (const col of allColumns) {
        const qbAsc = createMockQb();
        StudentFilterUtils.applyOrdering(qbAsc, [{ column: col, order: OrderSortDirection.ASC }]);
        // Primary column + id tie breaker
        expect(qbAsc.orderByExpressions.length).toBeGreaterThanOrEqual(1);

        const qbDesc = createMockQb();
        StudentFilterUtils.applyOrdering(qbDesc, [{ column: col, order: OrderSortDirection.DESC }]);
        expect(qbDesc.orderByExpressions.length).toBeGreaterThanOrEqual(1);
      }
    });

    test("applies multiple sort clauses simultaneously", () => {
      const qb = createMockQb();
      StudentFilterUtils.applyOrdering(qb, [
        { column: StudentsOrderByColumn.STATUS, order: OrderSortDirection.ASC },
        { column: StudentsOrderByColumn.NAME, order: OrderSortDirection.DESC },
      ]);
      // 2 primary columns + 1 tie breaker
      expect(qb.orderByExpressions).toHaveLength(3);
    });

    test("sets DESC id tie breaker when CREATED_AT is DESC", () => {
      const qbDesc = createMockQb();
      StudentFilterUtils.applyOrdering(qbDesc, [
        { column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.DESC },
      ]);
      expect(qbDesc.orderByExpressions).toHaveLength(2);

      const qbAsc = createMockQb();
      StudentFilterUtils.applyOrdering(qbAsc, [
        { column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.ASC },
      ]);
      expect(qbAsc.orderByExpressions).toHaveLength(2);
    });

    test("ignores unknown columns and still applies default tie breaker", () => {
      const qb = createMockQb();
      StudentFilterUtils.applyOrdering(qb, [
        { column: "NON_EXISTENT_COLUMN" as unknown as StudentsOrderByColumn, order: OrderSortDirection.ASC },
      ]);
      expect(qb.orderByExpressions).toHaveLength(1);
    });

    test("integrates cleanly with real Drizzle dynamic query for SQL generation", () => {
      let query = db.select().from(students).$dynamic();

      query = StudentFilterUtils.applyOrdering(query, [
        { column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.DESC },
      ]);

      const sqlObj = query.toSQL();
      expect(sqlObj.sql).toContain("order by");
      expect(sqlObj.sql).toContain('"students"."created_at" desc');
      expect(sqlObj.sql).toContain('"students"."id" desc');
    });
  });
});
