import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { AppPermission, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { LocalizedStringScalar } from "@/backend/graphql/scalars/localizedStringScalar";
import type { GroupClassAuditReturnType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome, GroupClassAttendanceStatus } from "@/shared/constants";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "c33f7662-4c95-4e6d-8a38-9f6460d6ce6c";
const CLASS_INSTANCE_ID = "b2a25d14-1e2f-4f1b-9a1c-72f2f3d0c9e1";

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function buildAuditResult(): GroupClassAuditReturnType {
  return {
    id: CLASS_INSTANCE_ID,
    className: "Morning Math",
    courseCode: "MATH-1",
    teacherName: "Sarah Ahmed",
    originalDate: "2026-08-30",
    rescheduledDate: null,
    timeSlot: "10:00 - 11:00",
    venue: "Room 2",
    status: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.TAKEN,
    isFrozen: false,
    auditRemark: null,
    auditLoggedAt: "2026-08-30T11:05:00.000Z",
    isOneOnOne: false,
    registeredStudentCount: 1,
    totalStudentCount: 1,
    students: [
      {
        id: "student-row-1",
        name: "Omar Khaled",
        studentId: "student-1",
        initials: "OK",
        attendanceStatus: GroupClassAttendanceStatus.PRESENT,
        avatarUrl: null,
      },
    ],
    meetingInfo: {
      platform: "zoom",
      meetingId: "meeting-1",
      joinUrl: "https://example.com/join/meeting-1",
      logoUrl: null,
      providerName: null,
      source: null,
    },
    communications: [],
    adminNote: { content: "Reviewed.", lastUpdated: "2026-08-30T12:00:00.000Z" },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the query module is imported. The query resolves
// the mocked `GroupClassService` from the `@/backend/services` barrel, while
// the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

const getGroupClassAuditCalls: Array<{ userId: string; classInstanceId: string; tErrors: ErrorsLabels }> = [];

const getGroupClassAuditMock = mock(
  async (userId: string, classInstanceId: string, tErrors: ErrorsLabels): Promise<GroupClassAuditReturnType> => {
    getGroupClassAuditCalls.push({ userId, classInstanceId, tErrors });
    return buildAuditResult();
  }
);

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph, then substitute only the group class service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  GroupClassService: { getGroupClassAudit: getGroupClassAuditMock },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the audit types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the query under test.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalar the group-class audit object references. Guarded by the
// shared global flag so every schema-backed test file can reuse the same
// builder when bun runs them in a single process.
const SHARED_LOCALIZED_SCALAR = Symbol.for("siraj.groupClassTest.localizedScalarRegistered");
const globalForSharedScalar = globalThis as typeof globalThis & {
  [SHARED_LOCALIZED_SCALAR]?: boolean;
};

if (!globalForSharedScalar[SHARED_LOCALIZED_SCALAR]) {
  gqlSchemaBuilder.addScalarType("LocalizedString", LocalizedStringScalar, {});
  globalForSharedScalar[SHARED_LOCALIZED_SCALAR] = true;
}

await import("@/backend/graphql/query/classes/group-class.query");

gqlSchemaBuilder.queryType({});
const groupClassAuditSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.SESSION_VIEW_DETAILS],
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

const GROUP_CLASS_AUDIT_QUERY = `
  query GroupClassAudit($classInstanceId: String!) {
    groupClassAudit(classInstanceId: $classInstanceId) {
      id
      className
      courseCode
      teacherName
      timeSlot
      registeredStudentCount
      totalStudentCount
      isOneOnOne
      status
      outcome
      isFrozen
      students {
        id
        name
        attendanceStatus
      }
      meetingInfo {
        platform
        joinUrl
      }
      adminNote {
        content
        lastUpdated
      }
    }
  }
`;

async function executeGroupClassAudit(ctx: BaseContext): Promise<ExecutionResult> {
  return graphql({
    schema: groupClassAuditSchema,
    source: GROUP_CLASS_AUDIT_QUERY,
    variableValues: { classInstanceId: CLASS_INSTANCE_ID },
    contextValue: ctx,
  });
}

interface GroupClassAuditData {
  id: string;
  className: string;
  registeredStudentCount: number;
  totalStudentCount: number;
  isOneOnOne: boolean;
  status: string;
  outcome: string;
  students: Array<{ id: string; name: string; attendanceStatus: string }>;
  meetingInfo: { platform: string; joinUrl: string | null };
  adminNote: { content: string; lastUpdated: string };
}

function extractAudit(result: ExecutionResult): GroupClassAuditData | null {
  const data = result.data as { groupClassAudit?: GroupClassAuditData | null } | null | undefined;
  return data?.groupClassAudit ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("groupClassAudit query", () => {
  beforeEach(() => {
    getGroupClassAuditCalls.length = 0;
  });

  test("lets a non-super-admin caller with session view details read the audit", async () => {
    const result = await executeGroupClassAudit(makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const audit = extractAudit(result);
    expect(audit).not.toBeNull();
    expect(audit?.id).toBe(CLASS_INSTANCE_ID);
    expect(audit?.className).toBe("Morning Math");
    expect(audit?.registeredStudentCount).toBe(1);
    expect(audit?.status).toBe(ClassExecutionState.COMPLETED);
    expect(audit?.outcome).toBe(ClassOutcome.TAKEN);
    expect(audit?.isOneOnOne).toBe(false);
    expect(audit?.students).toHaveLength(1);
    // Pothos enum member names surface uppercased on the wire.
    expect(audit?.students[0]?.attendanceStatus).toBe("PRESENT");
    expect(audit?.meetingInfo.platform).toBe("zoom");
    expect(audit?.adminNote.content).toBe("Reviewed.");

    expect(getGroupClassAuditCalls).toHaveLength(1);
    expect(getGroupClassAuditCalls[0]?.userId).toBe(USER_ID);
    expect(getGroupClassAuditCalls[0]?.classInstanceId).toBe(CLASS_INSTANCE_ID);
    expect(getGroupClassAuditCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("lets super admins through without the explicit session view permission", async () => {
    const result = await executeGroupClassAudit(
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(extractAudit(result)).not.toBeNull();
    expect(getGroupClassAuditCalls).toHaveLength(1);
  });

  test("rejects callers missing the session view permission with a FORBIDDEN error", async () => {
    const result = await executeGroupClassAudit(makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractAudit(result)).toBeNull();
    expect(getGroupClassAuditCalls).toHaveLength(0);
  });

  test("rejects logged-out callers with a FORBIDDEN error", async () => {
    const result = await executeGroupClassAudit(makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractAudit(result)).toBeNull();
    expect(getGroupClassAuditCalls).toHaveLength(0);
  });
});
