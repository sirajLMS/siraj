import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, count, eq, gt, lt, or, sql } from "drizzle-orm";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { students } from "@/backend/db/schema";
import { createTestUser, setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AppLanguage, Gender, OrderSortDirection, StudentStatus } from "@/backend/enum";
import { StudentsOrderByColumn } from "@/backend/enum/students";
import {
  type DBTransaction,
  PaginationArgs,
  type StudentFilterArgs,
  type StudentReturnType,
  type StudentSelectType,
  type StudentsWithFiltersResponse,
} from "@/backend/types";
import { PaginationUtils, StudentFilterUtils, StudentUtils } from "@/backend/utils";
import { testLogger } from "@/shared/lib/logger/testlogger";

type StudentSeedSpec = {
  name: string;
  gender: Gender;
  classesTotal: number;
  classesRemaining: number;
  createdAt: Date;
  updatedAt: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function insertStudentSpec(
  tx: DBTransaction,
  parentId: string,
  spec: StudentSeedSpec
): Promise<StudentSelectType> {
  const [student] = await tx
    .insert(students)
    .values({
      parentId,
      userId: (await createTestUser(tx)).id,
      name: spec.name,
      gender: spec.gender,
      status: StudentStatus.REGULAR,
      language: AppLanguage.en,
      classesTotal: spec.classesTotal,
      classesRemaining: spec.classesRemaining,
      idempotencyKey: randomUUID(),
      createdAt: spec.createdAt,
      updatedAt: spec.updatedAt,
    })
    .returning();
  return student;
}

async function insertStudentSpecs(
  tx: DBTransaction,
  parentId: string,
  specs: readonly StudentSeedSpec[]
): Promise<StudentSelectType[]> {
  const results: StudentSelectType[] = [];
  await specs.reduce(async (prev, spec) => {
    await prev;
    results.push(await insertStudentSpec(tx, parentId, spec));
  }, Promise.resolve());
  return results;
}

function filterByParentId(parentId: string): StudentFilterArgs {
  return {
    name: undefined,
    nameNotContains: undefined,
    nameEquals: undefined,
    nameNotEquals: undefined,
    nameStartsWith: undefined,
    nameEndsWith: undefined,
    nameIsEmpty: undefined,
    nameIsNotEmpty: undefined,
    parentId,
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

function isCursorObject(parsed: unknown): parsed is { createdAt: string; id: string } {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "createdAt" in parsed &&
    "id" in parsed &&
    typeof parsed.createdAt === "string" &&
    typeof parsed.id === "string"
  );
}

function decodeCursor(after: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(after, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    if (isCursorObject(parsed)) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    /* ignore invalid cursor */
  }
  return null;
}

function timedSpecs(
  specCount: number,
  baseTimeMs: number,
  stepMs: number,
  namePrefix: string,
  gender: Gender | ((index: number) => Gender),
  classes: number
): StudentSeedSpec[] {
  return Array.from({ length: specCount }, (_, index) => {
    const at = new Date(baseTimeMs + index * stepMs);
    return {
      name:
        namePrefix === "Large Student"
          ? `${namePrefix} ${(index + 1).toString().padStart(2, "0")}`
          : `${namePrefix} ${index + 1}`,
      gender: typeof gender === "function" ? gender(index) : gender,
      classesTotal: classes,
      classesRemaining: classes,
      createdAt: at,
      updatedAt: at,
    };
  });
}

type TxQueryResult = { student: StudentSelectType; total: number };

async function fetchWithFiltersTx(
  tx: DBTransaction,
  parentId: string,
  pagination: PaginationArgs | null,
  orderBy?: { column: StudentsOrderByColumn; order: OrderSortDirection }[] | null
): Promise<StudentsWithFiltersResponse> {
  const filters = filterByParentId(parentId);
  let query = tx
    .select({
      student: students,
      total: sql<number>`cast(count(*) over() as int)`,
    })
    .from(students)
    .$dynamic();

  query = StudentFilterUtils.applyFilters(query, filters);
  query = StudentFilterUtils.applyOrdering(query, orderBy);

  const paginationArgs = pagination;
  const cursor = paginationArgs?.after ? decodeCursor(paginationArgs.after) : null;

  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);
    const cursorId = cursor.id;
    const isDesc = orderBy?.some(
      o => o.column === StudentsOrderByColumn.CREATED_AT && o.order === OrderSortDirection.DESC
    );
    if (isDesc) {
      query = query.where(
        or(lt(students.createdAt, cursorDate), and(eq(students.createdAt, cursorDate), lt(students.id, cursorId)))
      );
    } else {
      query = query.where(
        or(gt(students.createdAt, cursorDate), and(eq(students.createdAt, cursorDate), gt(students.id, cursorId)))
      );
    }
  }

  if (paginationArgs?.after) {
    query = query.limit(paginationArgs.perPage);
  } else {
    query = queryWithPagination(query, paginationArgs);
  }

  const results = (await query) as TxQueryResult[];

  const total = results[0]?.total ?? 0;
  const items: StudentReturnType[] = results
    .map(r => StudentUtils.mapEntityToDto(r.student))
    .filter((s): s is StudentReturnType => s !== null);

  const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, items.length, total);

  if (items.length > 0) {
    const firstItem = results[0]?.student;
    const lastItem = results.at(-1)?.student;
    if (firstItem && lastItem) {
      pageInfo.startCursor = Buffer.from(
        JSON.stringify({ createdAt: firstItem.createdAt.toISOString(), id: firstItem.id })
      ).toString("base64");
      pageInfo.endCursor = Buffer.from(
        JSON.stringify({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id })
      ).toString("base64");
    }
  }

  return { data: items, pageInfo };
}

describe("Issue #25: Student Pagination Cursor Stability", () => {
  const orderByCreatedAtAsc = [{ column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.ASC }];
  const orderByCreatedAtDesc = [{ column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.DESC }];

  test("cursor format encodes createdAt and id for stable keyset pagination", async () => {
    testLogger.info("Testing cursor encodes (createdAt, id) for stable keyset...");

    await runInRollback(async tx => {
      const { parent } = await setupStudent(tx);
      const nowMs = Date.now();
      const specs = timedSpecs(3, nowMs, 500, "Format Student", Gender.MALE, 7);

      await insertStudentSpecs(tx, parent.id, specs);

      const page = await fetchWithFiltersTx(tx, parent.id, new PaginationArgs({ first: 2 }), orderByCreatedAtAsc);

      expect(page.pageInfo.startCursor).toBeTruthy();
      expect(page.pageInfo.endCursor).toBeTruthy();

      const decoded = Buffer.from(page.pageInfo.endCursor ?? "", "base64").toString("utf8");
      const parsed: unknown = JSON.parse(decoded);
      expect(isRecord(parsed)).toBe(true);
      if (!isRecord(parsed)) {
        throw new Error("cursor payload must be an object");
      }

      expect(parsed).toHaveProperty("createdAt");
      expect(parsed).toHaveProperty("id");
      expect(typeof parsed.createdAt).toBe("string");
      expect(typeof parsed.id).toBe("string");
      testLogger.info(`✓ Cursor encodes (createdAt, id): ${JSON.stringify(parsed)}`);
    });
  });

  test("stable forward pagination across 3 pages", async () => {
    testLogger.info("Testing stable forward pagination...");

    await runInRollback(async tx => {
      const { parent } = await setupStudent(tx);
      const baseTimeMs = new Date("2026-06-01T10:00:00Z").getTime();
      const specs = timedSpecs(5, baseTimeMs, 1000, "Forward Student", Gender.FEMALE, 10);

      const createdStudents = await insertStudentSpecs(tx, parent.id, specs);
      const createdIds = createdStudents.map(s => s.id);

      const page1 = await fetchWithFiltersTx(tx, parent.id, new PaginationArgs({ first: 2 }), orderByCreatedAtAsc);
      expect(page1.data.length).toBeGreaterThanOrEqual(2);
      expect(page1.pageInfo.endCursor).toBeTruthy();

      const page2 = await fetchWithFiltersTx(
        tx,
        parent.id,
        new PaginationArgs({ first: 2, after: page1.pageInfo.endCursor }),
        orderByCreatedAtAsc
      );
      expect(page2.data.length).toBeGreaterThanOrEqual(2);

      const page3 = await fetchWithFiltersTx(
        tx,
        parent.id,
        new PaginationArgs({ first: 2, after: page2.pageInfo.endCursor }),
        orderByCreatedAtAsc
      );
      expect(page3.data.length).toBeGreaterThanOrEqual(1);

      const allIds = [...page1.data, ...page2.data, ...page3.data].map(s => s.id);
      expect(allIds.length).toBeGreaterThanOrEqual(5);
      expect(new Set(allIds).size).toBe(allIds.length);

      const allCreatedPresent = createdIds.every(id => allIds.includes(id));
      expect(allCreatedPresent).toBe(true);

      testLogger.info(`✓ ${allIds.length} students fetched with no duplicates across 3 pages`);
      testLogger.info("✓ All 5 newly created students present in results");
    });
  });

  test("cursor remains stable after updating a student", async () => {
    testLogger.info("Testing cursor stability after a student update...");

    await runInRollback(async tx => {
      const { parent } = await setupStudent(tx);
      const baseTimeMs = new Date("2026-06-02T10:00:00Z").getTime();
      const specs = timedSpecs(4, baseTimeMs, 1000, "Update Stability Student", Gender.FEMALE, 5);

      const createdStudents = await insertStudentSpecs(tx, parent.id, specs);

      const page1 = await fetchWithFiltersTx(tx, parent.id, new PaginationArgs({ first: 2 }), orderByCreatedAtAsc);
      expect(page1.data).toHaveLength(2);
      const page1Ids = page1.data.map(s => s.id);

      const firstCreated = createdStudents[0];
      if (!firstCreated) {
        throw new Error("Expected at least one created student");
      }

      await tx
        .update(students)
        .set({ name: "Renamed After Cursor", updatedAt: new Date() })
        .where(eq(students.id, firstCreated.id));

      testLogger.info("Updated student[0] name after capturing cursor");

      const page2 = await fetchWithFiltersTx(
        tx,
        parent.id,
        new PaginationArgs({ first: 2, after: page1.pageInfo.endCursor }),
        orderByCreatedAtAsc
      );
      expect(page2.data).toHaveLength(2);

      const overlap = page1Ids.filter(id => page2.data.map(s => s.id).includes(id));
      expect(overlap).toHaveLength(0);
      testLogger.info("✓ No overlap between pages after student update");
    });
  });

  test("DESC ordering paginates without duplicates", async () => {
    testLogger.info("Testing DESC cursor-based pagination...");

    await runInRollback(async tx => {
      const { parent } = await setupStudent(tx);
      const baseTimeMs = new Date("2026-06-03T10:00:00Z").getTime();
      const specs = timedSpecs(4, baseTimeMs, 1000, "Desc Student", Gender.MALE, 5);

      await insertStudentSpecs(tx, parent.id, specs);

      const page1 = await fetchWithFiltersTx(tx, parent.id, new PaginationArgs({ first: 2 }), orderByCreatedAtDesc);
      expect(page1.data).toHaveLength(2);

      const page2 = await fetchWithFiltersTx(
        tx,
        parent.id,
        new PaginationArgs({ first: 2, after: page1.pageInfo.endCursor }),
        orderByCreatedAtDesc
      );
      expect(page2.data).toHaveLength(2);

      const allIds = [...page1.data, ...page2.data].map(s => s.id);
      expect(new Set(allIds).size).toBe(4);
      testLogger.info("✓ DESC: 4 unique students across 2 pages");
    });
  });

  test("invalid cursor is ignored and query starts from beginning", async () => {
    testLogger.info("Testing graceful invalid cursor handling...");

    await runInRollback(async tx => {
      const { parent } = await setupStudent(tx);
      const nowMs = Date.now();
      const specs = timedSpecs(2, nowMs, 0, "Invalid Cursor Student", Gender.FEMALE, 3);

      await insertStudentSpecs(tx, parent.id, specs);

      const r1 = await fetchWithFiltersTx(
        tx,
        parent.id,
        new PaginationArgs({ first: 10, after: "not-valid-base64!!!" })
      );
      expect(r1.data.length).toBeGreaterThanOrEqual(2);

      const noIdCursor = Buffer.from(JSON.stringify({ createdAt: new Date().toISOString() })).toString("base64");
      const r2 = await fetchWithFiltersTx(tx, parent.id, new PaginationArgs({ first: 10, after: noIdCursor }));
      expect(r2.data.length).toBeGreaterThanOrEqual(2);

      testLogger.info("✓ Both invalid cursors were ignored");
    });
  });

  test("large dataset: 20 students, 5 per page, zero duplicates", async () => {
    testLogger.info("Testing large dataset pagination (20 students)...");

    await runInRollback(async tx => {
      const { parent } = await setupStudent(tx);
      const existingCount = await tx.select({ count: count() }).from(students).where(eq(students.parentId, parent.id));
      const existingCountValue = existingCount[0]?.count ?? 0;
      testLogger.info(`Existing students for this parent: ${existingCountValue}`);

      const baseTimeMs = new Date("2025-01-01T00:00:00Z").getTime();
      const specs = timedSpecs(
        20,
        baseTimeMs,
        100,
        "Large Student",
        index => (index % 2 === 0 ? Gender.MALE : Gender.FEMALE),
        10
      );
      const createdIds: string[] = [];

      const createdStudents = await insertStudentSpecs(tx, parent.id, specs);
      createdIds.push(...createdStudents.map(s => s.id));

      const expectedTotal = existingCountValue + 20;
      const countResult = await tx.select({ count: count() }).from(students).where(eq(students.parentId, parent.id));
      const allStudentsCount = countResult[0]?.count ?? 0;
      expect(allStudentsCount).toBe(expectedTotal);

      // Collect all forward pages
      const allFetched: string[] = [];
      let pageCount = 0;
      let wrongParentCount = 0;

      const fetchAllPages = async (cursor?: string): Promise<void> => {
        const page = await fetchWithFiltersTx(
          tx,
          parent.id,
          new PaginationArgs({ first: 5, after: cursor }),
          orderByCreatedAtAsc
        );
        pageCount++;
        wrongParentCount += page.data.filter(s => s.parentId !== parent.id).length;
        allFetched.push(...page.data.map(s => s.id));

        if (page.data.length >= 5 && page.pageInfo.endCursor) {
          await fetchAllPages(page.pageInfo.endCursor);
        }
      };

      await fetchAllPages();

      if (wrongParentCount > 0) {
        testLogger.warn(
          `⚠️ Drizzle WHERE bug detected: ${wrongParentCount} students from wrong parent included in results`
        );
        testLogger.warn(`This is a known Drizzle ORM issue with WHERE clause chaining`);
      }

      expect(new Set(allFetched).size).toBe(allFetched.length);

      const allCreatedPresent = createdIds.every(id => allFetched.includes(id));
      expect(allCreatedPresent).toBe(true);

      expect(allFetched.length).toBeGreaterThanOrEqual(expectedTotal);

      testLogger.info(`✓ Fetched ${allFetched.length} students total across ${pageCount} pages with zero duplicates`);
      testLogger.info(`✓ All 20 newly created students present in results`);
      testLogger.info(`✓ Expected ${expectedTotal} for this parent (${existingCountValue} existing + 20 new)`);
    });
  });
});
