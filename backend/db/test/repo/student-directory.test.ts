import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { StudentRepository } from "@/backend/db/repo";
import { OrderSortDirection, StudentStatus } from "@/backend/enum";
import type { StudentFilterArgs, StudentsOrderByClause } from "@/backend/types";
import { PaginationArgs, StudentsOrderByColumn } from "@/backend/types";
import { setupStudent, setupTeacher } from "../entity-setup";
import { runInRollback } from "../test-utils";

function dirTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

async function createStudentWithTeacher(tx: DBTransaction, studentName: string, teacherName: string) {
  const { teacher } = await setupTeacher(tx, {
    name: teacherName,
    email: `tch-${teacherName.toLowerCase()}-${randomUUID()}@t.com`,
  });
  const { student } = await setupStudent(
    tx,
    { name: `${studentName} Parent`, email: `par-${studentName.toLowerCase()}-${randomUUID()}@t.com` },
    {},
    { name: studentName, classesTotal: 10, classesRemaining: 5, primaryTeacherId: teacher.id }
  );
  return { student };
}

describe("StudentRepository.getDirectoryRows", () => {
  describe("Success paths", () => {
    dirTest("returns enriched rows with parent name and teacher name", async tx => {
      const { student } = await createStudentWithTeacher(tx, "DirAlice", "DirTeacherA");

      const result = await StudentRepository.getDirectoryRows(null, null, null, tx);

      const row = result.rows.find(r => r.id === student.id);
      expect(row).toBeDefined();
      expect(row?.parentName).toBeDefined();
      expect(row?.teacherName).toBe("DirTeacherA");
    });

    dirTest("returns correct totalCount", async tx => {
      await createStudentWithTeacher(tx, "DirCountA", "DirCountT");

      const result = await StudentRepository.getDirectoryRows(null, null, null, tx);
      expect(result.totalCount).toBeGreaterThanOrEqual(result.rows.length);
    });

    dirTest("includes hoursPerWeek as number (parsed from numeric column)", async tx => {
      await createStudentWithTeacher(tx, "DirHours", "DirHoursT");

      const result = await StudentRepository.getDirectoryRows(null, null, null, tx);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(typeof result.rows[0]?.hoursPerWeek).toBe("number");
    });

    dirTest("returns null teacherName for students without assigned teacher", async tx => {
      await setupStudent(
        tx,
        { name: "NoTchr Par", email: `notchr-${randomUUID()}@t.com` },
        {},
        { name: "NoTeacherStudent", primaryTeacherId: null }
      );

      const result = await StudentRepository.getDirectoryRows(null, null, null, tx);
      const unassigned = result.rows.find(r => r.name === "NoTeacherStudent");
      expect(unassigned).toBeDefined();
      expect(unassigned?.teacherName).toBeNull();
      expect(unassigned?.parentName).toBe("NoTchr Par");
    });
  });

  describe("Filter paths", () => {
    dirTest("applies name filter (nameEquals)", async tx => {
      const uniqueName = `FilterName_${randomUUID()}`;
      await setupStudent(tx, { name: "Filt Par", email: `filt-${randomUUID()}@t.com` }, {}, { name: uniqueName });

      const filters: Partial<StudentFilterArgs> = {
        nameEquals: uniqueName,
      };

      const result = await StudentRepository.getDirectoryRows(null, filters as StudentFilterArgs, null, tx);
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      expect(result.rows.every(r => r.name === uniqueName)).toBe(true);
    });

    dirTest("applies status filter", async tx => {
      await setupStudent(
        tx,
        { name: "Status Par", email: `stat-${randomUUID()}@t.com` },
        {},
        { name: "StatusStudent", status: "REGULAR" }
      );

      const filters: Partial<StudentFilterArgs> = {
        status: StudentStatus.REGULAR,
      };

      const result = await StudentRepository.getDirectoryRows(null, filters as StudentFilterArgs, null, tx);
      expect(result.rows.every(r => r.status === "REGULAR")).toBe(true);
    });
  });

  describe("Pagination paths", () => {
    dirTest("respects perPage limit via PaginationArgs", async tx => {
      for (let i = 0; i < 3; i++) {
        await setupStudent(
          tx,
          { name: `Pag Par ${i}`, email: `pag-${i}-${randomUUID()}@t.com` },
          {},
          { name: `PagStudent_${i}` }
        );
      }

      const pagination = new PaginationArgs({ first: 2 });
      const result = await StudentRepository.getDirectoryRows(pagination, null, null, tx);
      expect(result.rows.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Ordering paths", () => {
    dirTest("orders by createdAt DESC", async tx => {
      await setupStudent(tx, { name: "Ord Par 1", email: `ord1-${randomUUID()}@t.com` }, {}, { name: "OrdStudent1" });
      await setupStudent(tx, { name: "Ord Par 2", email: `ord2-${randomUUID()}@t.com` }, {}, { name: "OrdStudent2" });

      const orderBy: StudentsOrderByClause[] = [
        { column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.DESC },
      ];

      const result = await StudentRepository.getDirectoryRows(null, null, orderBy, tx);

      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i]?.createdAt <= result.rows[i - 1]?.createdAt).toBe(true);
      }
    });

    dirTest("orders by name ASC", async tx => {
      const nameA = `AAA_${randomUUID()}`;
      const nameZ = `ZZZ_${randomUUID()}`;

      await setupStudent(tx, { name: "OrdA Par", email: `orda-${randomUUID()}@t.com` }, {}, { name: nameA });
      await setupStudent(tx, { name: "OrdZ Par", email: `ordz-${randomUUID()}@t.com` }, {}, { name: nameZ });

      const orderBy: StudentsOrderByClause[] = [{ column: StudentsOrderByColumn.NAME, order: OrderSortDirection.ASC }];

      const result = await StudentRepository.getDirectoryRows(null, null, orderBy, tx);

      const idxA = result.rows.findIndex(r => r.name === nameA);
      const idxZ = result.rows.findIndex(r => r.name === nameZ);
      if (idxA >= 0 && idxZ >= 0) {
        expect(idxA).toBeLessThan(idxZ);
      }
    });
  });

  describe("Empty result handling", () => {
    dirTest("returns empty array when no students match filter", async tx => {
      const filters: Partial<StudentFilterArgs> = {
        nameEquals: `NonExistent_${randomUUID()}_X`,
      };

      const result = await StudentRepository.getDirectoryRows(null, filters as StudentFilterArgs, null, tx);
      expect(result.rows).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
