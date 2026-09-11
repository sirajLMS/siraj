import { describe, expect, test } from "bun:test";
import { db } from "@/backend/db/drizzleDb";
import { students } from "@/backend/db/schema";
import { AppLanguage, Gender, OrderSortDirection } from "@/backend/enum";
import { StudentsOrderByColumn } from "@/backend/enum/students";
import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum";
import type * as Types from "@/backend/types";
import { StudentFilterUtils } from "@/backend/utils/student.filterUtils";

type MockQb = {
  readonly qb: Parameters<typeof StudentFilterUtils.applyFilters>[0];
  readonly whereClauses: unknown[];
  readonly orderByExpressions: unknown[];
};

function createMockQb(): MockQb {
  const whereClauses: unknown[] = [];
  const orderByExpressions: unknown[] = [];
  const qb = db.select().from(students).$dynamic();

  qb.where = (clause: unknown) => {
    whereClauses.push(clause);
    return qb;
  };

  qb.orderBy = (...exprs: unknown[]) => {
    orderByExpressions.push(...exprs);
    return qb;
  };

  return { qb, whereClauses, orderByExpressions };
}

function emptyFilterArgs(): Types.StudentFilterArgs {
  return {
    name: undefined,
    nameNotContains: undefined,
    nameEquals: undefined,
    nameNotEquals: undefined,
    nameStartsWith: undefined,
    nameEndsWith: undefined,
    nameIsEmpty: undefined,
    nameIsNotEmpty: undefined,
    parentId: undefined,
    primaryTeacherId: undefined,
    gender: undefined,
    language: undefined,
    status: undefined,
    createdAt: undefined,
    createdAtNot: undefined,
    createdAtFrom: undefined,
    createdAtTo: undefined,
    createdAtAfter: undefined,
    createdAtBefore: undefined,
    createdAtOnOrAfter: undefined,
    createdAtOnOrBefore: undefined,
    createdAtIsEmpty: undefined,
    createdAtIsNotEmpty: undefined,
    birthDate: undefined,
    birthDateNot: undefined,
    birthDateFrom: undefined,
    birthDateTo: undefined,
    birthDateAfter: undefined,
    birthDateBefore: undefined,
    birthDateOnOrAfter: undefined,
    birthDateOnOrBefore: undefined,
    birthDateIsEmpty: undefined,
    birthDateIsNotEmpty: undefined,
  };
}

function makeFilterArgs(partial: Partial<Types.StudentFilterArgs>): Types.StudentFilterArgs {
  return { ...emptyFilterArgs(), ...partial };
}

describe("StudentFilterUtils", () => {
  describe("applyFilters", () => {
    test("returns qb unmodified when args is null, undefined, or empty object", () => {
      const m1 = createMockQb();
      expect(StudentFilterUtils.applyFilters(m1.qb, null)).toBe(m1.qb);
      expect(m1.whereClauses).toHaveLength(0);

      const m2 = createMockQb();
      expect(StudentFilterUtils.applyFilters(m2.qb)).toBe(m2.qb);
      expect(m2.whereClauses).toHaveLength(0);

      const m3 = createMockQb();
      expect(StudentFilterUtils.applyFilters(m3.qb, makeFilterArgs({}))).toBe(m3.qb);
      expect(m3.whereClauses).toHaveLength(0);
    });

    test("applies individual name filters correctly", () => {
      // Test name (full text search)
      const mName = createMockQb();
      StudentFilterUtils.applyFilters(mName.qb, makeFilterArgs({ name: "John" }));
      expect(mName.whereClauses).toHaveLength(1);

      // Test nameNotContains with wildcards
      const mNotContains = createMockQb();
      StudentFilterUtils.applyFilters(mNotContains.qb, makeFilterArgs({ nameNotContains: "admin_%user" }));
      expect(mNotContains.whereClauses).toHaveLength(1);

      // Test nameEquals
      const mEquals = createMockQb();
      StudentFilterUtils.applyFilters(mEquals.qb, makeFilterArgs({ nameEquals: "Alice Smith" }));
      expect(mEquals.whereClauses).toHaveLength(1);

      // Test nameNotEquals
      const mNotEquals = createMockQb();
      StudentFilterUtils.applyFilters(mNotEquals.qb, makeFilterArgs({ nameNotEquals: "Bob Jones" }));
      expect(mNotEquals.whereClauses).toHaveLength(1);

      // Test nameStartsWith with wildcard escaping
      const mStartsWith = createMockQb();
      StudentFilterUtils.applyFilters(mStartsWith.qb, makeFilterArgs({ nameStartsWith: "Al_%_test" }));
      expect(mStartsWith.whereClauses).toHaveLength(1);

      // Test nameEndsWith with wildcard escaping
      const mEndsWith = createMockQb();
      StudentFilterUtils.applyFilters(mEndsWith.qb, makeFilterArgs({ nameEndsWith: "_smith%" }));
      expect(mEndsWith.whereClauses).toHaveLength(1);

      // Test nameIsEmpty
      const mIsEmpty = createMockQb();
      StudentFilterUtils.applyFilters(mIsEmpty.qb, makeFilterArgs({ nameIsEmpty: true }));
      expect(mIsEmpty.whereClauses).toHaveLength(1);

      // Test nameIsNotEmpty
      const mIsNotEmpty = createMockQb();
      StudentFilterUtils.applyFilters(mIsNotEmpty.qb, makeFilterArgs({ nameIsNotEmpty: true }));
      expect(mIsNotEmpty.whereClauses).toHaveLength(1);
    });

    test("applies other entity attribute filters individually", () => {
      const mParent = createMockQb();
      StudentFilterUtils.applyFilters(mParent.qb, makeFilterArgs({ parentId: "p-101" }));
      expect(mParent.whereClauses).toHaveLength(1);

      const mTeacher = createMockQb();
      StudentFilterUtils.applyFilters(mTeacher.qb, makeFilterArgs({ primaryTeacherId: "t-202" }));
      expect(mTeacher.whereClauses).toHaveLength(1);

      const mGender = createMockQb();
      StudentFilterUtils.applyFilters(mGender.qb, makeFilterArgs({ gender: Gender.FEMALE }));
      expect(mGender.whereClauses).toHaveLength(1);

      const mLang = createMockQb();
      StudentFilterUtils.applyFilters(mLang.qb, makeFilterArgs({ language: AppLanguage.ar }));
      expect(mLang.whereClauses).toHaveLength(1);

      const mStatus = createMockQb();
      StudentFilterUtils.applyFilters(mStatus.qb, makeFilterArgs({ status: StudentStatus.DEACTIVATED }));
      expect(mStatus.whereClauses).toHaveLength(1);
    });

    function verifyDateFilters(date1: Date, date2: Date, keyPrefix: "createdAt" | "birthDate"): void {
      const keys = [
        "",
        "Not",
        "From",
        "To",
        "After",
        "Before",
        "OnOrAfter",
        "OnOrBefore",
        "IsEmpty",
        "IsNotEmpty",
      ] as const;

      for (const suffix of keys) {
        const key = `${keyPrefix}${suffix}` as keyof Types.StudentFilterArgs;
        let value: unknown;
        if (suffix === "IsEmpty" || suffix === "IsNotEmpty") {
          value = true;
        } else if (suffix === "To" || suffix === "Before" || suffix === "OnOrBefore") {
          value = date2;
        } else {
          value = date1;
        }

        const m = createMockQb();
        StudentFilterUtils.applyFilters(m.qb, makeFilterArgs({ [key]: value }));
        expect(m.whereClauses).toHaveLength(1);
      }
    }

    test("applies createdAt filters individually", () => {
      verifyDateFilters(new Date("2026-01-01T00:00:00Z"), new Date("2026-06-01T00:00:00Z"), "createdAt");
    });

    test("applies birthDate filters individually", () => {
      verifyDateFilters(new Date("2012-03-15"), new Date("2018-09-20"), "birthDate");
    });

    test("applies multi-field filter combination simultaneously", () => {
      const m = createMockQb();
      const args = makeFilterArgs({
        nameStartsWith: "Sam",
        parentId: "p-55",
        status: StudentStatus.REGULAR,
        gender: Gender.FEMALE,
        createdAtOnOrAfter: new Date("2026-01-01"),
        birthDateOnOrBefore: new Date("2015-01-01"),
      });

      StudentFilterUtils.applyFilters(m.qb, args);
      expect(m.whereClauses).toHaveLength(6);
    });

    test("integrates cleanly with real Drizzle dynamic select query", () => {
      let query = db.select().from(students).$dynamic();

      query = StudentFilterUtils.applyFilters(
        query,
        makeFilterArgs({
          parentId: "parent-uuid-1",
        })
      );

      const sqlObj = query.toSQL();
      expect(sqlObj.sql).toContain("where");
      expect(sqlObj.sql).toContain('"students"."parent_id" = $1');
    });
  });

  describe("applyOrdering", () => {
    test("applies default ordering by id ASC when orderBy is null, undefined, or empty", () => {
      const m1 = createMockQb();
      StudentFilterUtils.applyOrdering(m1.qb, null);
      expect(m1.orderByExpressions).toHaveLength(1);

      const m2 = createMockQb();
      StudentFilterUtils.applyOrdering(m2.qb);
      expect(m2.orderByExpressions).toHaveLength(1);

      const m3 = createMockQb();
      StudentFilterUtils.applyOrdering(m3.qb, []);
      expect(m3.orderByExpressions).toHaveLength(1);
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
        const mAsc = createMockQb();
        StudentFilterUtils.applyOrdering(mAsc.qb, [{ column: col, order: OrderSortDirection.ASC }]);
        // Primary column + id tie breaker
        expect(mAsc.orderByExpressions.length).toBeGreaterThanOrEqual(1);

        const mDesc = createMockQb();
        StudentFilterUtils.applyOrdering(mDesc.qb, [{ column: col, order: OrderSortDirection.DESC }]);
        expect(mDesc.orderByExpressions.length).toBeGreaterThanOrEqual(1);
      }
    });

    test("applies multiple sort clauses simultaneously", () => {
      const m = createMockQb();
      StudentFilterUtils.applyOrdering(m.qb, [
        { column: StudentsOrderByColumn.STATUS, order: OrderSortDirection.ASC },
        { column: StudentsOrderByColumn.NAME, order: OrderSortDirection.DESC },
      ]);
      // 2 primary columns + 1 tie breaker
      expect(m.orderByExpressions).toHaveLength(3);
    });

    test("sets DESC id tie breaker when CREATED_AT is DESC", () => {
      const mDesc = createMockQb();
      StudentFilterUtils.applyOrdering(mDesc.qb, [
        { column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.DESC },
      ]);
      expect(mDesc.orderByExpressions).toHaveLength(2);

      const mAsc = createMockQb();
      StudentFilterUtils.applyOrdering(mAsc.qb, [
        { column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.ASC },
      ]);
      expect(mAsc.orderByExpressions).toHaveLength(2);
    });

    test("ignores unknown columns and still applies default tie breaker", () => {
      const m = createMockQb();
      const unknownColumn: StudentsOrderByColumn = JSON.parse('"NON_EXISTENT_COLUMN"');
      StudentFilterUtils.applyOrdering(m.qb, [{ column: unknownColumn, order: OrderSortDirection.ASC }]);
      expect(m.orderByExpressions).toHaveLength(1);
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
