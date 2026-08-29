import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, CalculationStatus, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import type { PayrollReportFilters, PayrollReportPage, PayrollReportRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const INSTANCE_ID = "22222222-2222-2222-2222-222222222222";
const TEACHER_ID = "33333333-3333-3333-3333-333333333333";
const STUDENT_ID = "44444444-4444-4444-4444-444444444444";
const SUBJECT_ID = "55555555-5555-5555-5555-555555555555";

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildReportRow(overrides: Partial<PayrollReportRow> = {}): PayrollReportRow {
  return {
    instanceId: INSTANCE_ID,
    scheduledStartAt: "2026-08-20T10:00:00.000Z",
    scheduledEndAt: "2026-08-20T11:00:00.000Z",
    scheduledDurationMinutes: 60,
    actualStartAt: "2026-08-20T10:02:00.000Z",
    actualEndAt: "2026-08-20T11:00:00.000Z",
    calculatedDuration: 58,
    teacherPaidAmount: "116.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.CALCULATED,
    isPartialPercentage: null,
    payrollNote: null,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    studentId: STUDENT_ID,
    studentName: "Omar Khaled",
    subjectId: SUBJECT_ID,
    subjectName: "Mathematics",
    isStudentAbsence: false,
    isTeacherAbsence: false,
    ...overrides,
  };
}

function buildRowCountByStatus(calculated: number, refund: number): Record<CalculationStatus, number> {
  return {
    [CalculationStatus.NOT_CALCULATED]: 0,
    [CalculationStatus.CALCULATED]: calculated,
    [CalculationStatus.PARTIALLY]: 0,
    [CalculationStatus.REFUND]: refund,
    [CalculationStatus.WAITING_PAID]: 0,
    [CalculationStatus.PAID]: 0,
  };
}

function buildReportPage(rows: readonly PayrollReportRow[]): PayrollReportPage {
  return {
    rows: [...rows],
    totalCount: rows.length,
    aggregates: {
      totalPaidAmount: "116.00",
      totalPaidCurrency: CurrencyCode.SAR,
      rowCountByStatus: buildRowCountByStatus(
        rows.filter(row => row.calculationStatus === CalculationStatus.CALCULATED).length,
        rows.filter(row => row.calculationStatus === CalculationStatus.REFUND).length
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the query module is imported. The query resolves
// the mocked `PayrollCalculationService` from the `@/backend/services`
// barrel, while the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface GetReportCall {
  actorUserId: string;
  filters: PayrollReportFilters;
  pagination: { limit: number; offset: number };
  tErrors: ErrorsLabels;
}

const getReportCalls: GetReportCall[] = [];
let reportResult: PayrollReportPage = buildReportPage([buildReportRow()]);

const getReportMock = mock(
  async (
    actorUserId: string,
    filters: PayrollReportFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<PayrollReportPage> => {
    getReportCalls.push({ actorUserId, filters, pagination, tErrors });
    return reportResult;
  }
);

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph (lib, db, and repo modules resolve named exports
// from this barrel), then substitute only the payroll service.
const realServices = await import("@/backend/services");

void mock.module(
  "@/backend/services",
  () =>
    new Proxy(realServices, {
      get: (target, property, receiver) =>
        property === "PayrollCalculationService"
          ? { getReport: getReportMock }
          : Reflect.get(target, property, receiver),
    })
);

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the payroll types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the query under test, so the payroll types
// register against the real pipeline and the schema executes identically.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
gqlSchemaBuilder.addScalarType("JSON", JSONScalar);

await import("@/backend/graphql/query/teachers/payroll.query");

gqlSchemaBuilder.queryType({});
const payrollSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_PAYROLL_VIEW],
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
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  teacherName: string;
  studentName: string;
  subjectName: string;
  isStudentAbsence: boolean;
  isTeacherAbsence: boolean;
}

interface ReportPageData {
  totalCount: number;
  rows: ReportRowData[];
  aggregates: {
    totalPaidAmount: string;
    totalPaidCurrency: CurrencyCode;
    rowCountByStatus: Record<CalculationStatus, number>;
  };
}

function extractPage(result: ExecutionResult): ReportPageData | null {
  const data = result.data as { payrollReport?: ReportPageData | null } | null | undefined;
  return data?.payrollReport ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

const PAYROLL_REPORT_QUERY = `
  query PayrollReport($filter: PayrollReportFilter, $limit: Int, $offset: Int) {
    payrollReport(filter: $filter, limit: $limit, offset: $offset) {
      rows {
        id
        instanceId
        scheduledStartAt
        scheduledEndAt
        scheduledDurationMinutes
        actualStartAt
        actualEndAt
        calculatedDuration
        teacherPaidAmount
        teacherPaidCurrency
        calculationStatus
        isPartialPercentage
        payrollNote
        teacherId
        teacherName
        studentId
        studentName
        subjectId
        subjectName
        isStudentAbsence
        isTeacherAbsence
      }
      totalCount
      aggregates {
        totalPaidAmount
        totalPaidCurrency
        rowCountByStatus
      }
    }
  }
`;

async function executePayrollReport(
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({
    schema: payrollSchema,
    source: PAYROLL_REPORT_QUERY,
    variableValues,
    contextValue: ctx,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("payrollReport query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    reportResult = buildReportPage([
      buildReportRow(),
      buildReportRow({
        instanceId: "66666666-6666-6666-6666-666666666666",
        calculationStatus: CalculationStatus.REFUND,
        teacherPaidAmount: "0.00",
      }),
    ]);
  });

  test("returns the page shape with rows, totalCount, and aggregates", async () => {
    const result = await executePayrollReport({}, makeCtx());

    expect(result.errors?.[0]?.message).toBe("DEBUG");
    const page = extractPage(result);
    expect(page).not.toBeNull();
    expect(page?.totalCount).toBe(2);
    expect(page?.rows).toHaveLength(2);

    const row = page?.rows[0];
    expect(row?.instanceId).toBe(INSTANCE_ID);
    expect(row?.id).toBe(INSTANCE_ID);
    expect(row?.scheduledStartAt).toBe("2026-08-20T10:00:00.000Z");
    expect(row?.teacherPaidAmount).toBe("116.00");
    expect(row?.teacherPaidCurrency).toBe(CurrencyCode.SAR);
    expect(row?.calculationStatus).toBe(CalculationStatus.CALCULATED);
    expect(row?.isPartialPercentage).toBeNull();
    expect(row?.payrollNote).toBeNull();
    expect(row?.teacherName).toBe("Sarah Ahmed");
    expect(row?.studentName).toBe("Omar Khaled");
    expect(row?.subjectName).toBe("Mathematics");
    expect(row?.isStudentAbsence).toBe(false);
    expect(row?.isTeacherAbsence).toBe(false);

    expect(page?.aggregates.totalPaidAmount).toBe("116.00");
    expect(page?.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    expect(page?.aggregates.rowCountByStatus).toEqual(buildRowCountByStatus(1, 1));

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getReportCalls[0]?.filters).toEqual({});
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
    expect(getReportCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("passes explicit limit and offset through as the service pagination", async () => {
    await executePayrollReport({ limit: 25, offset: 50 }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 25, offset: 50 });
  });

  test("falls back to the default pagination when limit and offset are null", async () => {
    await executePayrollReport({ limit: null, offset: null }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
  });

  test("maps the filter input to the service filters", async () => {
    const filter = {
      teacherId: TEACHER_ID,
      studentId: STUDENT_ID,
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      calculationStatuses: [CalculationStatus.CALCULATED, CalculationStatus.REFUND],
      search: "Sarah",
    };

    await executePayrollReport({ filter }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters).toEqual(filter);
  });

  test("maps null and omitted filters to empty filters", async () => {
    await executePayrollReport({ filter: null }, makeCtx());
    await executePayrollReport({}, makeCtx());

    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters).toEqual({});
    expect(getReportCalls[1]?.filters).toEqual({});
  });

  test("rejects callers without the payroll view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executePayrollReport({}, makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("rejects unauthenticated callers with a UNAUTHENTICATED GraphQL error", async () => {
    const result = await executePayrollReport({}, makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST }));

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("allows super admins without the explicit payroll permission", async () => {
    const result = await executePayrollReport(
      {},
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
  });
});
