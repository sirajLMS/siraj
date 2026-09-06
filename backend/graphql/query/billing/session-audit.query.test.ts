import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, CalculationStatus, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import type {
  SessionAuditReportFilters,
  SessionAuditReportPage,
  SessionAuditReportRow,
  SessionAuditReportSort,
  SessionAuditReportSortField,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const INSTANCE_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const TEACHER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const STUDENT_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const SUBJECT_ID = "[CARD_REDACTED]-[CARD_REDACTED]";

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildReportRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    instanceId: INSTANCE_ID,
    scheduledStartAt: "2026-08-20T10:00:00.000Z",
    scheduledEndAt: "2026-08-20T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-20T10:02:00.000Z",
    actualEndAt: "2026-08-20T11:00:00.000Z",
    bookingTimezone: "Asia/Riyadh",
    currentStatus: "end",
    calculatedDuration: 58,
    teacherPaidAmount: "116.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.PAID,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: "2026-08-21T08:00:00.000Z",
    carryoverBalanceId: null,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    studentId: STUDENT_ID,
    studentName: "Omar Khaled",
    subjectId: SUBJECT_ID,
    subjectName: "Mathematics",
    teacherDuePaymentDate: "2026-08-22T00:00:00.000Z",
    ...overrides,
  };
}

function buildReportPage(rows: readonly SessionAuditReportRow[]): SessionAuditReportPage {
  return {
    rows: [...rows],
    totalCount: rows.length,
    aggregates: {
      rowCountByStatus: { open: 0, end: rows.length, Absent: 0, absent_student: 0 },
      rowCountByPaid: { paid: rows.length, unpaid: 0 },
      totalPaidAmount: "116.00",
      totalPaidCurrency: CurrencyCode.SAR,
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the query module is imported. The query resolves
// the mocked `SessionAuditService` from the `@/backend/services` barrel, while
// the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface GetReportCall {
  actorUserId: string;
  filters: SessionAuditReportFilters;
  sort: SessionAuditReportSort | null | undefined;
  pagination: { limit: number; offset: number };
  tErrors: ErrorsLabels;
}

const getReportCalls: GetReportCall[] = [];
let reportResult: SessionAuditReportPage = buildReportPage([buildReportRow()]);

const getReportMock = mock(
  async (
    actorUserId: string,
    filters: SessionAuditReportFilters,
    sort: SessionAuditReportSort | null | undefined,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<SessionAuditReportPage> => {
    getReportCalls.push({ actorUserId, filters, sort, pagination, tErrors });
    return reportResult;
  }
);

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph, then substitute only the session audit service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  SessionAuditService: { getReport: getReportMock },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the audit types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the query under test.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the audit report types reference. Guarded by the shared
// global flag so every schema-backed report test file can reuse the same
// builder when bun runs them in a single process.
const SHARED_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForSharedTest = globalThis as typeof globalThis & {
  [SHARED_TEST_SCALARS]?: boolean;
};

if (!globalForSharedTest[SHARED_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForSharedTest[SHARED_TEST_SCALARS] = true;
}

await import("@/backend/graphql/query/billing/session-audit.query");

gqlSchemaBuilder.queryType({});
const sessionAuditSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_REPORTS_VIEW],
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

interface ReportRowData {
  id: string;
  instanceId: string;
  scheduledStartAt: string;
  durationMinutes: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
  bookingTimezone: string | null;
  currentStatus: string;
  calculatedDuration: number | null;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus | null;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  payrollCalculatedAt: string | null;
  teacherName: string;
  studentName: string;
  subjectName: string;
  teacherDuePaymentDate: string | null;
}

interface ReportPageData {
  totalCount: number;
  rows: ReportRowData[];
  aggregates: {
    rowCountByStatus: Record<string, number>;
    rowCountByPaid: { paid: number; unpaid: number };
    totalPaidAmount: string;
    totalPaidCurrency: CurrencyCode;
  };
}

function extractPage(result: ExecutionResult): ReportPageData | null {
  const data = result.data as { sessionAuditReport?: ReportPageData | null } | null | undefined;
  return data?.sessionAuditReport ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

const SESSION_AUDIT_REPORT_QUERY = `
  query SessionAuditReport($filter: SessionAuditReportFilter, $sort: SessionAuditReportSort, $limit: Int, $offset: Int) {
    sessionAuditReport(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
      rows {
        id
        instanceId
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        actualStartAt
        actualEndAt
        bookingTimezone
        currentStatus
        calculatedDuration
        teacherPaidAmount
        teacherPaidCurrency
        calculationStatus
        isPartialPercentage
        payrollNote
        payrollCalculatedAt
        teacherId
        teacherName
        studentId
        studentName
        subjectId
        subjectName
        teacherDuePaymentDate
      }
      totalCount
      aggregates {
        rowCountByStatus
        rowCountByPaid
        totalPaidAmount
        totalPaidCurrency
      }
    }
  }
`;

async function executeSessionAuditReport(
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({
    schema: sessionAuditSchema,
    source: SESSION_AUDIT_REPORT_QUERY,
    variableValues,
    contextValue: ctx,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sessionAuditReport query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    reportResult = buildReportPage([buildReportRow()]);
  });

  test("returns the page shape with rows, totalCount, and aggregates", async () => {
    const result = await executeSessionAuditReport({}, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const page = extractPage(result);
    expect(page).not.toBeNull();
    expect(page?.totalCount).toBe(1);
    expect(page?.rows).toHaveLength(1);

    const row = page?.rows[0];
    expect(row?.id).toBe(INSTANCE_ID);
    expect(row?.instanceId).toBe(INSTANCE_ID);
    expect(row && new Date(row.scheduledStartAt).toISOString()).toBe("2026-08-20T10:00:00.000Z");
    expect(row?.durationMinutes).toBe(60);
    expect(row?.bookingTimezone).toBe("Asia/Riyadh");
    expect(row?.currentStatus).toBe("end");
    expect(row?.calculatedDuration).toBe(58);
    expect(row?.teacherPaidAmount).toBe("116.00");
    expect(row?.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(row?.calculationStatus).toBe(CalculationStatus.PAID);
    expect(row?.payrollCalculatedAt && new Date(row.payrollCalculatedAt).toISOString()).toBe(
      "2026-08-21T08:00:00.000Z"
    );
    expect(row?.teacherName).toBe("Sarah Ahmed");
    expect(row?.studentName).toBe("Omar Khaled");
    expect(row?.subjectName).toBe("Mathematics");
    expect(row?.teacherDuePaymentDate && new Date(row.teacherDuePaymentDate).toISOString()).toBe(
      "2026-08-22T00:00:00.000Z"
    );

    expect(page?.aggregates.totalPaidAmount).toBe("116.00");
    expect(page?.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    expect(page?.aggregates.rowCountByStatus).toEqual({ open: 0, end: 1, Absent: 0, absent_student: 0 });
    expect(page?.aggregates.rowCountByPaid).toEqual({ paid: 1, unpaid: 0 });

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getReportCalls[0]?.sort).toBeNull();
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
    expect(getReportCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("passes explicit limit and offset through as the service pagination", async () => {
    await executeSessionAuditReport({ limit: 25, offset: 100 }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 25, offset: 100 });
  });

  test("maps the sort input to the service sort contract", async () => {
    await executeSessionAuditReport({ sort: { field: "teacherPaidAmount", direction: "ASC" } }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.sort).toEqual({ field: "teacherPaidAmount", direction: "asc" });
  });

  test("maps every sort field value through to the service", async () => {
    const fields: readonly SessionAuditReportSortField[] = [
      "scheduledStartAt",
      "scheduledEndAt",
      "actualStartAt",
      "actualEndAt",
      "durationMinutes",
      "calculatedDuration",
      "teacherPaidAmount",
      "calculationStatus",
      "teacherName",
      "studentName",
    ];

    await Promise.all(
      fields.map(field => executeSessionAuditReport({ sort: { field, direction: "DESC" } }, makeCtx()))
    );

    expect(getReportCalls).toHaveLength(fields.length);
    const capturedSorts = getReportCalls.map(call => call.sort);
    for (const field of fields) {
      expect(capturedSorts).toContainEqual({ field, direction: "desc" });
    }
  });

  test("maps the filter input (including statuses) to the service filters", async () => {
    const result = await executeSessionAuditReport(
      {
        filter: {
          teacherId: TEACHER_ID,
          studentId: STUDENT_ID,
          dateFrom: "2026-08-01",
          dateTo: "2026-08-31",
          currentStatuses: ["open", "Absent", "absent_student"],
          search: "Sarah",
          includeDeleted: true,
        },
      },
      makeCtx({
        permissions: [AppPermission.ACCOUNTING_REPORTS_VIEW, AppPermission.ACCOUNTING_REPORTS_MANAGE],
      })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters).toEqual({
      teacherId: TEACHER_ID,
      studentId: STUDENT_ID,
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      currentStatuses: ["open", "Absent", "absent_student"],
      search: "Sarah",
      includeDeleted: true,
    });
  });

  test("maps null and omitted filters to empty filters", async () => {
    await executeSessionAuditReport({ filter: null }, makeCtx());
    await executeSessionAuditReport({}, makeCtx());

    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters).toEqual({
      teacherId: undefined,
      studentId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      currentStatuses: undefined,
      search: undefined,
      includeDeleted: undefined,
    });
    expect(getReportCalls[1]?.filters).toEqual(getReportCalls[0]?.filters);
  });

  test("clears includeDeleted for callers without the reports manage permission", async () => {
    const result = await executeSessionAuditReport({ filter: { includeDeleted: true } }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(false);
  });

  test("keeps includeDeleted for callers holding the reports manage permission", async () => {
    const result = await executeSessionAuditReport(
      { filter: { includeDeleted: true } },
      makeCtx({
        permissions: [AppPermission.ACCOUNTING_REPORTS_VIEW, AppPermission.ACCOUNTING_REPORTS_MANAGE],
      })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(true);
  });

  test("keeps includeDeleted for super admins without the explicit manage permission", async () => {
    const result = await executeSessionAuditReport(
      { filter: { includeDeleted: true } },
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(true);
  });

  test("passes null payroll fields through untouched", async () => {
    reportResult = buildReportPage([
      buildReportRow({
        currentStatus: "open",
        calculatedDuration: null,
        teacherPaidAmount: null,
        teacherPaidCurrency: null,
        calculationStatus: null,
        isPartialPercentage: null,
        payrollNote: null,
        payrollCalculatedAt: null,
        teacherDuePaymentDate: null,
      }),
    ]);

    const result = await executeSessionAuditReport({}, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const row = extractPage(result)?.rows[0];
    expect(row?.currentStatus).toBe("open");
    expect(row?.calculatedDuration).toBeNull();
    expect(row?.teacherPaidAmount).toBeNull();
    expect(row?.teacherPaidCurrency).toBeNull();
    expect(row?.calculationStatus).toBeNull();
    expect(row?.isPartialPercentage).toBeNull();
    expect(row?.payrollNote).toBeNull();
    expect(row?.payrollCalculatedAt).toBeNull();
    expect(row?.teacherDuePaymentDate).toBeNull();
  });

  test("serializes the teacher-absence and student-absence statuses verbatim", async () => {
    reportResult = buildReportPage([
      buildReportRow({ currentStatus: "Absent", actualStartAt: null }),
      buildReportRow({ currentStatus: "absent_student" }),
    ]);

    const result = await executeSessionAuditReport({}, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const rows = extractPage(result)?.rows;
    expect(rows?.[0]?.currentStatus).toBe("Absent");
    expect(rows?.[1]?.currentStatus).toBe("absent_student");
  });

  test("rejects callers without the reports view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executeSessionAuditReport({}, makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("rejects logged-out callers with a FORBIDDEN GraphQL error", async () => {
    const result = await executeSessionAuditReport(
      {},
      makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("the resolver itself rejects a permissioned context without a user id", async () => {
    const result = await executeSessionAuditReport({}, makeCtx({ user: undefined, role: UserRole.GUEST }));

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("allows super admins without the explicit reports permission", async () => {
    const result = await executeSessionAuditReport(
      {},
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
  });
});
