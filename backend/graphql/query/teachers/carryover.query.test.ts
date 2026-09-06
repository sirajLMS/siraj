import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, CalculationStatus, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import type { CarryoverFilters, CarryoverLinkedSession, CarryoverPage, CarryoverRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "6f118f7a-158a-447a-94a7-c815f326bebf";
const CARRYOVER_ID = "3b6f8d97-8b4e-4c8e-9f02-5b7c6f0b03a1";
const CARRYOVER_ID_2 = "a5c2d607-06cc-4f1e-9a44-40c9f8d61ab2";
const TEACHER_ID = "77d3f278-20e8-4d2d-9b6a-8f0c1e5a4d90";
const EXPENSE_ID = "e2f1a8b5-6c3d-4e90-8b7a-1d2c3e4f5a6b";
const CLASS_INSTANCE_ID = "0f4a9b3c-2d5e-4a1b-8c7d-9e2f1a3b5c7d";
const STUDENT_ID = "9b8a7c6d-5e4f-43a2-b1c0-d9e8f7a6b5c4";

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildCarryoverRow(overrides: Partial<CarryoverRow> = {}): CarryoverRow {
  return {
    id: CARRYOVER_ID,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    teacherAvatarUrl: null,
    studentsCount: 3,
    studentsText: "Omar Khaled, Layla Nasser, Karim Fahad",
    totalDuration: "05:30:00",
    payable: "320.00",
    teacherCurrency: CurrencyCode.SAR,
    paid: "100.00",
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    paymentDate: "2026-08-05",
    isDisabledTeacher: false,
    isPaid: false,
    expenseId: null,
    note: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    paidAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function buildCarryoverPage(rows: readonly CarryoverRow[]): CarryoverPage {
  return {
    rows: [...rows],
    totalCount: rows.length,
    aggregates: {
      totalPayable: "640.00",
      totalPaid: "200.00",
      dominantCurrency: CurrencyCode.SAR,
      rowCountByPaid: { paid: 1, unpaid: Math.max(rows.length - 1, 0) },
    },
  };
}

function buildLinkedSession(overrides: Partial<CarryoverLinkedSession> = {}): CarryoverLinkedSession {
  return {
    id: CLASS_INSTANCE_ID,
    studentId: STUDENT_ID,
    studentName: "Omar Khaled",
    subjectName: "Physics",
    scheduledStartAt: "2026-07-12T13:00:00.000Z",
    durationMinutes: 90,
    originalAmount: "25.00",
    originalCurrency: CurrencyCode.SAR,
    originalStatus: "CALCULATED",
    currentStatus: CalculationStatus.WAITING_PAID,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the query module is imported. The query resolves
// the mocked `CarryoverBalanceService` from the `@/backend/services` barrel,
// while the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface GetReportCall {
  actorUserId: string;
  filters: CarryoverFilters;
  pagination: { limit: number; offset: number };
  tErrors: ErrorsLabels;
}

interface GetByIdCall {
  actorUserId: string;
  id: string;
  tErrors: ErrorsLabels;
}

interface GetLinkedSessionsCall {
  actorUserId: string;
  carryoverId: string;
  tErrors: ErrorsLabels;
}

const getReportCalls: GetReportCall[] = [];
const getByIdCalls: GetByIdCall[] = [];
const getLinkedSessionsCalls: GetLinkedSessionsCall[] = [];
const countBatchCalls: string[][] = [];
let reportResult: CarryoverPage = buildCarryoverPage([buildCarryoverRow()]);
let byIdResult: CarryoverRow = buildCarryoverRow();
let linkedSessionsResult: CarryoverLinkedSession[] = [];
let linkedSessionCounts = new Map<string, number>();

const getReportMock = mock(
  async (
    actorUserId: string,
    filters: CarryoverFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<CarryoverPage> => {
    getReportCalls.push({ actorUserId, filters, pagination, tErrors });
    return reportResult;
  }
);

const getByIdMock = mock(async (actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<CarryoverRow> => {
  getByIdCalls.push({ actorUserId, id, tErrors });
  return byIdResult;
});

const getLinkedSessionsMock = mock(
  async (actorUserId: string, carryoverId: string, tErrors: ErrorsLabels): Promise<CarryoverLinkedSession[]> => {
    getLinkedSessionsCalls.push({ actorUserId, carryoverId, tErrors });
    return linkedSessionsResult;
  }
);

const countLinkedSessionsByCarryoverIdsMock = mock(
  async (carryoverIds: readonly string[]): Promise<Map<string, number>> => {
    countBatchCalls.push([...carryoverIds]);
    return linkedSessionCounts;
  }
);

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph (lib, db, and repo modules resolve named exports
// from this barrel), then substitute only the carryover balance service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  CarryoverBalanceService: {
    getReport: getReportMock,
    getById: getByIdMock,
    getLinkedSessions: getLinkedSessionsMock,
    countLinkedSessionsByCarryoverIds: countLinkedSessionsByCarryoverIdsMock,
  },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the carryover types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the query under test, so the carryover types
// register against the real pipeline and the schema executes identically.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the carryover types reference. Guarded by the shared
// global flag so every schema-backed report test file can reuse the same
// builder when bun runs them in a single process (module caches persist).
const SHARED_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForSharedTest = globalThis as typeof globalThis & {
  [SHARED_TEST_SCALARS]?: boolean;
};

if (!globalForSharedTest[SHARED_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForSharedTest[SHARED_TEST_SCALARS] = true;
}

await import("@/backend/graphql/query/teachers/carryover.query");

gqlSchemaBuilder.queryType({});
const carryoverSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_CARRYOVER_VIEW],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating: false,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
    ...overrides,
  };
}

interface CarryoverRowData {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentsCount: number | null;
  studentsText: string | null;
  totalDuration: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  paid: string;
  fromDate: string | null;
  toDate: string | null;
  paymentDate: string | null;
  isDisabledTeacher: boolean;
  isPaid: boolean;
  expenseId: string | null;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface CarryoverPageData {
  totalCount: number;
  rows: CarryoverRowData[];
  aggregates: {
    totalPayable: string;
    totalPaid: string;
    dominantCurrency: CurrencyCode;
    rowCountByPaid: { paid: number; unpaid: number };
  };
}

function extractPage(result: ExecutionResult): CarryoverPageData | null {
  const data = result.data as { carryoverBalances?: CarryoverPageData | null } | null | undefined;
  return data?.carryoverBalances ?? null;
}

function extractRow(result: ExecutionResult): CarryoverRowData | null {
  const data = result.data as { carryoverBalance?: CarryoverRowData | null } | null | undefined;
  return data?.carryoverBalance ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

interface LinkedSessionData {
  id: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  scheduledStartAt: string;
  durationMinutes: number;
  originalAmount: string;
  originalCurrency: CurrencyCode;
  originalStatus: string;
  currentStatus: CalculationStatus;
}

function extractLinkedSessions(result: ExecutionResult): LinkedSessionData[] | null {
  const data = result.data as { carryoverBalanceLinkedSessions?: LinkedSessionData[] | null } | null | undefined;
  return data?.carryoverBalanceLinkedSessions ?? null;
}

interface LinkedCountRowData {
  id: string;
  linkedSessionCount: number;
}

function extractCountPage(result: ExecutionResult): { rows: LinkedCountRowData[] } | null {
  const data = result.data as { carryoverBalances?: { rows: LinkedCountRowData[] } | null } | null | undefined;
  return data?.carryoverBalances ?? null;
}

const CARRYOVER_BALANCES_QUERY = `
  query CarryoverBalances($filter: CarryoverFilter, $limit: Int, $offset: Int) {
    carryoverBalances(filter: $filter, limit: $limit, offset: $offset) {
      rows {
        id
        teacherId
        teacherName
        teacherAvatarUrl
        studentsCount
        studentsText
        totalDuration
        payable
        teacherCurrency
        paid
        fromDate
        toDate
        paymentDate
        isDisabledTeacher
        isPaid
        expenseId
        note
        createdAt
        paidAt
      }
      totalCount
      aggregates {
        totalPayable
        totalPaid
        dominantCurrency
        rowCountByPaid
      }
    }
  }
`;

const CARRYOVER_BALANCE_QUERY = `
  query CarryoverBalance($id: ID!) {
    carryoverBalance(id: $id) {
      id
      teacherId
      teacherName
      payable
      teacherCurrency
      paid
      isPaid
      expenseId
      createdAt
      paidAt
    }
  }
`;

const CARRYOVER_BALANCE_COUNT_QUERY = `
  query CarryoverBalanceCount($id: ID!) {
    carryoverBalance(id: $id) {
      id
      linkedSessionCount
    }
  }
`;

const CARRYOVER_BALANCES_COUNT_QUERY = `
  query CarryoverBalancesCounts {
    carryoverBalances {
      rows {
        id
        linkedSessionCount
      }
      totalCount
    }
  }
`;

const LINKED_SESSIONS_QUERY = `
  query CarryoverBalanceLinkedSessions($carryoverId: ID!) {
    carryoverBalanceLinkedSessions(carryoverId: $carryoverId) {
      id
      studentId
      studentName
      subjectName
      scheduledStartAt
      durationMinutes
      originalAmount
      originalCurrency
      originalStatus
      currentStatus
    }
  }
`;

async function executeCarryover(
  source: string,
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({
    schema: carryoverSchema,
    source,
    variableValues,
    contextValue: ctx,
  });
}

function makeCarryoverExecutor(
  source: string
): (variableValues: Record<string, unknown>, ctx: BaseContext) => Promise<ExecutionResult> {
  return (variableValues, ctx) => executeCarryover(source, variableValues, ctx);
}

const executeCarryoverBalances = makeCarryoverExecutor(CARRYOVER_BALANCES_QUERY);
const executeCarryoverBalance = makeCarryoverExecutor(CARRYOVER_BALANCE_QUERY);
const executeLinkedSessions = makeCarryoverExecutor(LINKED_SESSIONS_QUERY);
const executeBalanceCount = makeCarryoverExecutor(CARRYOVER_BALANCE_COUNT_QUERY);
const executeBalancesWithCounts = makeCarryoverExecutor(CARRYOVER_BALANCES_COUNT_QUERY);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("carryoverBalances query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    getByIdCalls.length = 0;
    reportResult = buildCarryoverPage([
      buildCarryoverRow(),
      buildCarryoverRow({ id: CARRYOVER_ID_2, isPaid: true, expenseId: EXPENSE_ID }),
    ]);
  });

  test("returns the page shape with rows, totalCount, and aggregates", async () => {
    const result = await executeCarryoverBalances({}, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const page = extractPage(result);
    expect(page).not.toBeNull();
    expect(page?.totalCount).toBe(2);
    expect(page?.rows).toHaveLength(2);

    const row = page?.rows[0];
    expect(row?.id).toBe(CARRYOVER_ID);
    expect(row?.teacherId).toBe(TEACHER_ID);
    expect(row?.teacherName).toBe("Sarah Ahmed");
    expect(row?.teacherAvatarUrl).toBeNull();
    expect(row?.studentsCount).toBe(3);
    expect(row?.studentsText).toBe("Omar Khaled, Layla Nasser, Karim Fahad");
    expect(row?.totalDuration).toBe("05:30:00");
    expect(row?.payable).toBe("320.00");
    expect(row?.teacherCurrency).toBe(CurrencyCode.SAR);
    expect(row?.paid).toBe("100.00");
    expect(row?.fromDate).toBe("2026-07-01");
    expect(row?.toDate).toBe("2026-07-31");
    expect(row?.paymentDate).toBe("2026-08-05");
    expect(row?.isDisabledTeacher).toBe(false);
    expect(row?.isPaid).toBe(false);
    expect(row?.expenseId).toBeNull();
    expect(row?.note).toBeNull();
    // The DateTime scalar serializes the row timestamp; compare the instant.
    expect(row && new Date(row.createdAt).toISOString()).toBe("2026-08-01T10:00:00.000Z");
    expect(row?.paidAt && new Date(row.paidAt).toISOString()).toBe("2026-08-05T12:00:00.000Z");

    expect(page?.aggregates.totalPayable).toBe("640.00");
    expect(page?.aggregates.totalPaid).toBe("200.00");
    expect(page?.aggregates.dominantCurrency).toBe(CurrencyCode.SAR);
    expect(page?.aggregates.rowCountByPaid).toEqual({ paid: 1, unpaid: 1 });

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
    expect(getReportCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("passes explicit limit and offset through as the service pagination", async () => {
    await executeCarryoverBalances({ limit: 25, offset: 50 }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 25, offset: 50 });
  });

  test("falls back to the default pagination when limit and offset are null", async () => {
    await executeCarryoverBalances({ limit: null, offset: null }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
  });

  test("passes wildcard and injection search payloads through to the service verbatim", async () => {
    await executeCarryoverBalances({ filter: { search: "%' OR '1'='1' --" } }, makeCtx());
    await executeCarryoverBalances({ filter: { search: "سارة \\__" } }, makeCtx());

    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters.search).toBe("%' OR '1'='1' --");
    expect(getReportCalls[1]?.filters.search).toBe("سارة \\__");
  });

  test("maps the filter input to the service filters", async () => {
    const filter: CarryoverFilters = {
      teacherId: TEACHER_ID,
      paidStatus: "Paid",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      includeDisabledTeachers: true,
      search: "Sarah",
    };

    await executeCarryoverBalances({ filter }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters).toEqual(filter);
  });

  test("maps an absent filter to all-null service filters", async () => {
    await executeCarryoverBalances({ filter: null }, makeCtx());
    await executeCarryoverBalances({}, makeCtx());

    const expected: CarryoverFilters = {
      teacherId: null,
      paidStatus: null,
      dateFrom: null,
      dateTo: null,
      includeDisabledTeachers: null,
      search: null,
    };
    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters).toEqual(expected);
    expect(getReportCalls[1]?.filters).toEqual(expected);
  });

  test("treats a blank or whitespace paidStatus as no filter", async () => {
    await executeCarryoverBalances({ filter: { paidStatus: "" } }, makeCtx());
    await executeCarryoverBalances({ filter: { paidStatus: "   " } }, makeCtx());

    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters.paidStatus).toBeNull();
    expect(getReportCalls[1]?.filters.paidStatus).toBeNull();
  });

  test("rejects an unknown paidStatus with a VALIDATION GraphQL error", async () => {
    const result = await executeCarryoverBalances({ filter: { paidStatus: "Partially" } }, makeCtx());

    expectErrorEnvelope(result, "VALIDATION", tErrorsEn.invalidInput);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("rejects a malformed teacherId with a VALIDATION GraphQL error instead of a uuid-cast database error", async () => {
    const result = await executeCarryoverBalances({ filter: { teacherId: "not-a-uuid" } }, makeCtx());

    expectErrorEnvelope(result, "VALIDATION", tErrorsEn.invalidInput);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("treats a blank teacherId as no filter and trims surrounding whitespace", async () => {
    await executeCarryoverBalances({ filter: { teacherId: "   " } }, makeCtx());
    await executeCarryoverBalances({ filter: { teacherId: ` ${TEACHER_ID} ` } }, makeCtx());

    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters.teacherId).toBeNull();
    expect(getReportCalls[1]?.filters.teacherId).toBe(TEACHER_ID);
  });

  test("rejects callers without the carryover view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executeCarryoverBalances({}, makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("rejects logged-out callers with a FORBIDDEN GraphQL error", async () => {
    const result = await executeCarryoverBalances(
      {},
      makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("the resolver itself rejects a permissioned context without a user id", async () => {
    const result = await executeCarryoverBalances({}, makeCtx({ user: undefined, role: UserRole.GUEST }));

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("allows super admins without the explicit carryover permission", async () => {
    const result = await executeCarryoverBalances(
      {},
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
  });
});

describe("carryoverBalance query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    getByIdCalls.length = 0;
    byIdResult = buildCarryoverRow({ isPaid: true, expenseId: EXPENSE_ID });
  });

  test("returns the carryover row resolved by id", async () => {
    const result = await executeCarryoverBalance({ id: CARRYOVER_ID }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const row = extractRow(result);
    expect(row?.id).toBe(CARRYOVER_ID);
    expect(row?.teacherId).toBe(TEACHER_ID);
    expect(row?.teacherName).toBe("Sarah Ahmed");
    expect(row?.payable).toBe("320.00");
    expect(row?.teacherCurrency).toBe(CurrencyCode.SAR);
    expect(row?.paid).toBe("100.00");
    expect(row?.isPaid).toBe(true);
    expect(row?.expenseId).toBe(EXPENSE_ID);
    expect(row && new Date(row.createdAt).toISOString()).toBe("2026-08-01T10:00:00.000Z");
    expect(row?.paidAt && new Date(row.paidAt).toISOString()).toBe("2026-08-05T12:00:00.000Z");

    expect(getByIdCalls).toHaveLength(1);
    expect(getByIdCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getByIdCalls[0]?.id).toBe(CARRYOVER_ID);
    expect(getByIdCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("rejects callers without the carryover view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executeCarryoverBalance({ id: CARRYOVER_ID }, makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractRow(result)).toBeNull();
    expect(getByIdCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// linkedSessionCount field + carryoverBalanceLinkedSessions query
// ---------------------------------------------------------------------------

function resetLinkedSessionState(): void {
  getLinkedSessionsCalls.length = 0;
  countBatchCalls.length = 0;
  linkedSessionsResult = [buildLinkedSession()];
  linkedSessionCounts = new Map([[CARRYOVER_ID, 2]]);
}

async function expectLinkedSessionsForbidden(ctx: BaseContext): Promise<void> {
  const result = await executeLinkedSessions({ carryoverId: CARRYOVER_ID }, ctx);
  expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
  expect(extractLinkedSessions(result)).toBeNull();
  expect(getLinkedSessionsCalls).toHaveLength(0);
}

describe("CarryoverBalance.linkedSessionCount", () => {
  beforeEach(() => {
    getByIdCalls.length = 0;
    byIdResult = buildCarryoverRow();
    resetLinkedSessionState();
  });

  test("resolves the count for a single carryover via the batch service call", async () => {
    const result = await executeBalanceCount({ id: CARRYOVER_ID }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const data = result.data as { carryoverBalance?: LinkedCountRowData | null } | null | undefined;
    expect(data?.carryoverBalance?.id).toBe(CARRYOVER_ID);
    expect(data?.carryoverBalance?.linkedSessionCount).toBe(2);

    expect(countBatchCalls).toHaveLength(1);
    expect(countBatchCalls[0]).toEqual([CARRYOVER_ID]);
  });

  test("batches the counts across a page of rows and falls back to zero", async () => {
    reportResult = buildCarryoverPage([
      buildCarryoverRow(),
      buildCarryoverRow({ id: CARRYOVER_ID_2, isPaid: true, expenseId: EXPENSE_ID }),
    ]);

    const result = await executeBalancesWithCounts({}, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const page = extractCountPage(result);
    const countsByRow = new Map(page?.rows.map(row => [row.id, row.linkedSessionCount]));
    expect(countsByRow.get(CARRYOVER_ID)).toBe(2);
    expect(countsByRow.get(CARRYOVER_ID_2)).toBe(0);

    // One batched load for the whole page — no per-row fan-out.
    expect(countBatchCalls).toHaveLength(1);
    const batchedIds = countBatchCalls[0] ?? [];
    expect(batchedIds).toHaveLength(2);
    expect(batchedIds).toContain(CARRYOVER_ID);
    expect(batchedIds).toContain(CARRYOVER_ID_2);
  });
});

describe("carryoverBalanceLinkedSessions query", () => {
  beforeEach(resetLinkedSessionState);

  test("returns the linked sessions with snapshots and current status", async () => {
    const result = await executeLinkedSessions({ carryoverId: CARRYOVER_ID }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const sessions = extractLinkedSessions(result);
    expect(sessions).toHaveLength(1);

    const session = sessions?.[0];
    expect(session?.id).toBe(CLASS_INSTANCE_ID);
    expect(session?.studentId).toBe(STUDENT_ID);
    expect(session?.studentName).toBe("Omar Khaled");
    expect(session?.subjectName).toBe("Physics");
    expect(session?.durationMinutes).toBe(90);
    expect(session?.originalAmount).toBe("25.00");
    expect(session?.originalCurrency).toBe(CurrencyCode.SAR);
    expect(session?.originalStatus).toBe("CALCULATED");
    expect(session?.currentStatus).toBe(CalculationStatus.WAITING_PAID);
    expect(session && new Date(session.scheduledStartAt).toISOString()).toBe("2026-07-12T13:00:00.000Z");

    expect(getLinkedSessionsCalls).toHaveLength(1);
    expect(getLinkedSessionsCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getLinkedSessionsCalls[0]?.carryoverId).toBe(CARRYOVER_ID);
    expect(getLinkedSessionsCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("returns an empty list when the carryover has no linked sessions", async () => {
    linkedSessionsResult = [];
    const result = await executeLinkedSessions({ carryoverId: CARRYOVER_ID }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expect(extractLinkedSessions(result)).toEqual([]);
  });

  test("rejects callers without the carryover view permission with a FORBIDDEN GraphQL error", async () => {
    await expectLinkedSessionsForbidden(makeCtx({ permissions: [] }));
  });

  test("rejects logged-out callers with a FORBIDDEN GraphQL error", async () => {
    await expectLinkedSessionsForbidden(makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST }));
  });

  test("allows super admins without the explicit carryover permission", async () => {
    const result = await executeLinkedSessions(
      { carryoverId: CARRYOVER_ID },
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getLinkedSessionsCalls).toHaveLength(1);
    expect(getLinkedSessionsCalls[0]?.actorUserId).toBe(USER_ID);
  });
});

describe("carryover queries — non-accounting actors", () => {
  test("an unrelated permission holder gets FORBIDDEN on every carryover read", async () => {
    getReportCalls.length = 0;
    getByIdCalls.length = 0;
    getLinkedSessionsCalls.length = 0;
    const ctx = makeCtx({ permissions: [AppPermission.SESSION_RESCHEDULE] });

    const page = await executeCarryoverBalances({}, ctx);
    const byId = await executeCarryoverBalance({ id: CARRYOVER_ID }, ctx);
    const linked = await executeLinkedSessions({ carryoverId: CARRYOVER_ID }, ctx);

    for (const result of [page, byId, linked]) {
      expect(result.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      expect(result.errors?.[0]?.message).toBe(tErrorsEn.insufficientPermissions);
    }
    expect(getReportCalls).toHaveLength(0);
    expect(getByIdCalls).toHaveLength(0);
    expect(getLinkedSessionsCalls).toHaveLength(0);
  });
});
