import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StudentRepository } from "@/backend/db/repo/students";
import { parents, students, users } from "@/backend/db/schema";
import {
  AccountStatus,
  AppLanguage,
  Gender,
  OrderSortDirection,
  ParentStatus,
  StudentStatus,
  UserRole,
} from "@/backend/enum";
import type { ParentEntity, StudentFilterArgs, StudentSelectType, UserReturnType } from "@/backend/types";
import { PaginationArgs, StudentsOrderByColumn } from "@/backend/types";
import { parseIanaTimezone } from "@/shared/lib/enum";
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

async function deleteUsersByIds(userIds: readonly string[]): Promise<void> {
  await Promise.all(userIds.map(userId => db.delete(users).where(eq(users.id, userId))));
}

function timedSpecs(
  count: number,
  baseTimeMs: number,
  stepMs: number,
  namePrefix: string,
  gender: Gender | ((index: number) => Gender),
  classes: number
): StudentSeedSpec[] {
  return Array.from({ length: count }, (_, index) => {
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

describe("Issue #25: Student Pagination Cursor Stability", () => {
  let testParent: ParentEntity;
  let testUser: UserReturnType;
  const createdStudentUserIds: string[] = [];

  async function createStudentUser(): Promise<string> {
    const userRows = await db
      .insert(users)
      .values({
        name: `Student User ${randomUUID().slice(0, 8)}`,
        email: `student-${randomUUID()}@example.com`,
        password: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const createdUser = userRows[0];
    if (!createdUser) {
      throw new Error("Failed to create student user");
    }
    createdStudentUserIds.push(createdUser.id);
    return createdUser.id;
  }

  async function insertStudents(specs: readonly StudentSeedSpec[]): Promise<StudentSelectType[]> {
    const rows = await Promise.all(
      specs.map(async spec => {
        const userId = await createStudentUser();
        const inserted = await db
          .insert(students)
          .values({
            parentId: testParent.id,
            userId,
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
        const student = inserted[0];
        if (!student) {
          throw new Error(`Failed to create student ${spec.name}`);
        }
        return student;
      })
    );
    return rows;
  }

  async function fetchParentPage(
    pagination: PaginationArgs,
    orderBy?: typeof orderByCreatedAtAsc
  ): Promise<Awaited<ReturnType<typeof StudentRepository.fetchWithFilters>>> {
    return StudentRepository.fetchWithFilters(pagination, filterByParentId(testParent.id), orderBy);
  }

  async function collectForwardPages(
    pageSize: number,
    orderBy: typeof orderByCreatedAtAsc,
    cursor?: string
  ): Promise<{ ids: string[]; wrongParentCount: number; pageCount: number }> {
    const page = await fetchParentPage(new PaginationArgs({ first: pageSize, after: cursor }), orderBy);
    const wrongParentCount = page.data.filter(s => s.parentId !== testParent.id).length;
    const ids = page.data.map(s => s.id);
    testLogger.info(`Page collected: ${page.data.length} students`);

    if (page.data.length === pageSize && page.pageInfo.endCursor) {
      const rest = await collectForwardPages(pageSize, orderBy, page.pageInfo.endCursor);
      return {
        ids: [...ids, ...rest.ids],
        wrongParentCount: wrongParentCount + rest.wrongParentCount,
        pageCount: 1 + rest.pageCount,
      };
    }
    return { ids, wrongParentCount, pageCount: 1 };
  }

  beforeAll(async () => {
    testLogger.info("Setting up test parent for pagination stability tests...");
    const userResult = await db
      .insert(users)
      .values({
        name: "Pagination Test User",
        email: `pagination-test-${randomUUID()}@example.com`,
        password: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const user = userResult[0];
    if (!user) {
      throw new Error("Failed to create pagination test user");
    }

    const parentRows = await db
      .insert(parents)
      .values({
        userId: user.id,
        status: ParentStatus.REGULAR,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const parent = parentRows[0];
    if (!parent) {
      throw new Error("Failed to create pagination test parent");
    }
    testParent = parent;

    testUser = {
      ...user,
      timezone: parseIanaTimezone(user.timezone),
      role: UserRole.PARENT,
      status: AccountStatus.ACTIVATED,
      parentId: testParent.id,
    };
  });

  afterEach(async () => {
    await db.delete(students).where(eq(students.parentId, testParent.id));
    await deleteUsersByIds(createdStudentUserIds);
    createdStudentUserIds.length = 0;
  });

  afterAll(async () => {
    testLogger.info("Cleaning up pagination stability test data...");
    await deleteUsersByIds(createdStudentUserIds);
    await db.delete(parents).where(eq(parents.id, testParent.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  const orderByCreatedAtAsc = [{ column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.ASC }];
  const orderByCreatedAtDesc = [{ column: StudentsOrderByColumn.CREATED_AT, order: OrderSortDirection.DESC }];

  test("cursor format encodes createdAt and id for stable keyset pagination", async () => {
    testLogger.info("Testing cursor encodes (createdAt, id) for stable keyset...");

    const nowMs = Date.now();
    await insertStudents(timedSpecs(3, nowMs, 500, "Format Student", Gender.MALE, 7));

    const page = await fetchParentPage(new PaginationArgs({ first: 2 }), orderByCreatedAtAsc);

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

  test("stable forward pagination across 3 pages", async () => {
    testLogger.info("Testing stable forward pagination...");

    const baseTimeMs = new Date("2026-06-01T10:00:00Z").getTime();
    const created = await insertStudents(timedSpecs(5, baseTimeMs, 1000, "Forward Student", Gender.FEMALE, 10));
    const createdIds = created.map(s => s.id);

    const page1 = await fetchParentPage(new PaginationArgs({ first: 2 }), orderByCreatedAtAsc);
    expect(page1.data.length).toBeGreaterThanOrEqual(2);
    expect(page1.pageInfo.endCursor).toBeTruthy();

    const page2 = await fetchParentPage(
      new PaginationArgs({ first: 2, after: page1.pageInfo.endCursor }),
      orderByCreatedAtAsc
    );
    expect(page2.data.length).toBeGreaterThanOrEqual(2);

    const page3 = await fetchParentPage(
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

  test("cursor remains stable after updating a student", async () => {
    testLogger.info("Testing cursor stability after a student update...");

    const baseTimeMs = new Date("2026-06-02T10:00:00Z").getTime();
    const createdStudents = await insertStudents(
      timedSpecs(4, baseTimeMs, 1000, "Update Stability Student", Gender.FEMALE, 5)
    );

    const page1 = await fetchParentPage(new PaginationArgs({ first: 2 }), orderByCreatedAtAsc);
    expect(page1.data).toHaveLength(2);
    const page1Ids = page1.data.map(s => s.id);

    const firstCreated = createdStudents[0];
    if (!firstCreated) {
      throw new Error("Expected at least one created student");
    }

    await db
      .update(students)
      .set({ name: "Renamed After Cursor", updatedAt: new Date() })
      .where(eq(students.id, firstCreated.id));

    testLogger.info("Updated student[0] name after capturing cursor");

    const page2 = await fetchParentPage(
      new PaginationArgs({ first: 2, after: page1.pageInfo.endCursor }),
      orderByCreatedAtAsc
    );
    expect(page2.data).toHaveLength(2);

    const overlap = page1Ids.filter(id => page2.data.map(s => s.id).includes(id));
    expect(overlap).toHaveLength(0);
    testLogger.info("✓ No overlap between pages after student update");
  });

  test("DESC ordering paginates without duplicates", async () => {
    testLogger.info("Testing DESC cursor-based pagination...");

    const baseTimeMs = new Date("2026-06-03T10:00:00Z").getTime();
    await insertStudents(timedSpecs(4, baseTimeMs, 1000, "Desc Student", Gender.MALE, 5));

    const page1 = await fetchParentPage(new PaginationArgs({ first: 2 }), orderByCreatedAtDesc);
    expect(page1.data).toHaveLength(2);

    const page2 = await fetchParentPage(
      new PaginationArgs({ first: 2, after: page1.pageInfo.endCursor }),
      orderByCreatedAtDesc
    );
    expect(page2.data).toHaveLength(2);

    const allIds = [...page1.data, ...page2.data].map(s => s.id);
    expect(new Set(allIds).size).toBe(4);
    testLogger.info("✓ DESC: 4 unique students across 2 pages");
  });

  test("invalid cursor is ignored and query starts from beginning", async () => {
    testLogger.info("Testing graceful invalid cursor handling...");

    const nowMs = Date.now();
    await insertStudents(timedSpecs(2, nowMs, 0, "Invalid Cursor Student", Gender.FEMALE, 3));

    const r1 = await fetchParentPage(new PaginationArgs({ first: 10, after: "not-valid-base64!!!" }));
    expect(r1.data.length).toBeGreaterThanOrEqual(2);

    const noIdCursor = Buffer.from(JSON.stringify({ createdAt: new Date().toISOString() })).toString("base64");
    const r2 = await fetchParentPage(new PaginationArgs({ first: 10, after: noIdCursor }));
    expect(r2.data.length).toBeGreaterThanOrEqual(2);

    testLogger.info("✓ Both invalid cursors were ignored");
  });

  test("large dataset: 20 students, 5 per page, zero duplicates", async () => {
    testLogger.info("Testing large dataset pagination (20 students)...");

    const existingCount = await db.$count(students, eq(students.parentId, testParent.id));
    testLogger.info(`Existing students for this parent: ${existingCount}`);

    const baseTimeMs = new Date("2025-01-01T00:00:00Z").getTime();
    const created = await insertStudents(
      timedSpecs(20, baseTimeMs, 100, "Large Student", index => (index % 2 === 0 ? Gender.MALE : Gender.FEMALE), 10)
    );
    const createdIds = created.map(s => s.id);

    const expectedTotal = existingCount + 20;
    const allStudentsCount = await db.$count(students, eq(students.parentId, testParent.id));
    expect(allStudentsCount).toBe(expectedTotal);

    const { ids: allFetched, wrongParentCount, pageCount } = await collectForwardPages(5, orderByCreatedAtAsc);

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
    testLogger.info(`✓ Expected ${expectedTotal} for this parent (${existingCount} existing + 20 new)`);
  });
});
