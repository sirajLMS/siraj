import { afterEach, describe, expect, mock, test } from "bun:test";

const deleteOrder: string[] = [];

function getTableName(table: Record<string | symbol, unknown>): string {
  const sym = Symbol.for("drizzle:Name").toString();
  const key = Object.getOwnPropertySymbols(table).find(s => s.toString() === sym);
  if (key !== undefined) {
    const val = table[key];
    if (typeof val === "string") return val;
  }
  const nested = table._;
  if (typeof nested === "object" && nested !== null && "name" in nested) {
    const nameVal = (nested as Record<string, unknown>).name;
    if (typeof nameVal === "string") return nameVal;
  }
  return "unknown";
}

const selectLimitResult = Promise.resolve([] as unknown[]);
const selectFromWhere = { where: () => ({ limit: () => selectLimitResult }) };
const selectFrom = { from: () => selectFromWhere };
const selectMock = mock(() => selectFrom);

const deleteMock = mock(() => ({ where: () => Promise.resolve() }));

const transactionMock = mock(async (cb: (tx: unknown) => Promise<unknown>) => {
  const mockTx = {
    execute: mock(() => Promise.resolve()),
    delete: (table: Record<string | symbol, unknown>) => ({
      where: () => {
        deleteOrder.push(getTableName(table));
        return Promise.resolve();
      },
    }),
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ id: "test-instance-id" }]),
      }),
    }),
  };
  return cb(mockTx);
});

await mock.module("@/backend/db/drizzleDb", () => ({
  db: {
    transaction: transactionMock,
    select: selectMock,
    delete: deleteMock,
  },
  queryDb: mock((tx?: unknown) => tx ?? { transaction: transactionMock }),
  drizzleLogs: [] as string[],
  getDrizzleDbPool: mock(() => null),
  clearDbConnectionSingleton: mock(() => {}),
}));

await mock.module("@/backend/db/repo/shared/signedUrl.repository", () => ({
  SignedUrlRepository: {
    findSignedUrlById: mock(() => Promise.resolve(null)),
    revokeSignedUrl: mock(() => Promise.resolve()),
  },
}));

await mock.module("@/backend/db/repo/users/user.repository", () => ({
  UserRepository: {
    findById: mock(() => Promise.resolve(null)),
    findByIds: mock(() => Promise.resolve([])),
  },
}));

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: mock((_msg: string, _ctx?: unknown) => {}),
    warn: mock((_msg: string, _ctx?: unknown) => {}),
    error: mock((_msg: string, _ctx?: unknown) => {}),
    debug: mock((_msg: string, _ctx?: unknown) => {}),
    log: mock((_msg: string, _ctx?: unknown) => {}),
  },
}));

await mock.module("@/backend/lib/test-helper-gate", () => ({
  assertTestHelperAllowed: mock(() => {}),
  isTestHelperEnabled: mock(() => true),
}));

await mock.module("@/backend/services/seed", () => ({
  PersonaSeedService: { create: mock(() => Promise.resolve({})) },
  StudentSeedService: { create: mock(() => Promise.resolve({})) },
  UserSeedService: { create: mock(() => Promise.resolve({})) },
}));

await mock.module("@/backend/services/system/reference-data.service", () => ({
  ReferenceDataService: { getReferenceData: mock(() => Promise.resolve({})) },
}));

await mock.module("@/backend/services/system/system-settings.service", () => ({
  SystemSettingsService: { getSetting: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/storage/demo/fileInitializationService", () => ({
  createFileSeedingService: mock(() => ({})),
}));

await mock.module("@/backend/lib/auth/password", () => ({
  hashPassword: mock(() => Promise.resolve("hashed")),
}));

const { TestHelperService } = await import("@/backend/services/system/test-helper.service");

afterEach(() => {
  deleteOrder.length = 0;
});

describe("TestHelperService.cleanupTestSuperAdmin FK-safe cleanup", () => {
  test("deletes admin_audit_logs before user (FK RESTRICT)", async () => {
    const result = await TestHelperService.cleanupTestSuperAdmin("test-user-id");

    expect(result).toBe(true);
    const auditLogIdx = deleteOrder.indexOf("admin_audit_logs");
    const userIdx = deleteOrder.indexOf("users");
    expect(auditLogIdx).toBeGreaterThanOrEqual(0);
    expect(userIdx).toBeGreaterThanOrEqual(0);
    expect(auditLogIdx).toBeLessThan(userIdx);
  });
});

describe("TestHelperService.cleanupTestEntities FK-safe cleanup", () => {
  test("deletes class_status_events before class_instances (FK RESTRICT)", async () => {
    const result = await TestHelperService.cleanupTestEntities({
      studentUserId: "stu-user",
      teacherUserId: "tea-user",
      parentUserId: "par-user",
      studentId: "stu-1",
      teacherId: "tea-1",
      parentId: "par-1",
    });

    expect(result).toBe(true);
    const statusEventsIdx = deleteOrder.indexOf("class_status_events");
    const classInstancesIdx = deleteOrder.indexOf("class_instances");
    expect(statusEventsIdx).toBeGreaterThanOrEqual(0);
    expect(classInstancesIdx).toBeGreaterThanOrEqual(0);
    expect(statusEventsIdx).toBeLessThan(classInstancesIdx);
  });

  test("returns false when transaction throws FK error", async () => {
    transactionMock.mockImplementationOnce(async () => {
      throw new Error("FK constraint violation");
    });

    const result = await TestHelperService.cleanupTestEntities({
      studentUserId: "stu-user",
      teacherUserId: "tea-user",
      parentUserId: "par-user",
      studentId: "stu-1",
      teacherId: "tea-1",
      parentId: "par-1",
    });

    expect(result).toBe(false);
  });
});
