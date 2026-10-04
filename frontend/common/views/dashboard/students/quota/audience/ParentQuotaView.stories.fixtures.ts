import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents";
import { setQuotaAudienceStoryUser } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.helpers";

export function setParentUser(): void {
  setQuotaAudienceStoryUser({
    id: "parent-001",
    name: "Hassan Parent",
    role: "PARENT",
    permissions: [],
    parentId: "parent-001",
  });
}

const ledgerPagination = {
  after: null,
  before: null,
  first: 5,
  last: null,
  maxCount: null,
  page: null,
  skip: 0,
};

const mockChildren = [
  {
    __typename: "AssociatedStudent" as const,
    id: "stu-001",
    name: "Ahmed Hassan",
    avatarUrl: null,
    status: "ACTIVE",
    primaryTeacherId: "teacher-001",
    teacherUserId: "teacher-001",
    teacherName: "Ustadh Yusuf",
    hoursPerWeek: "4",
    classesRemaining: 12,
    classesTotal: 20,
    language: "ARABIC",
    gender: "MALE",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
  {
    __typename: "AssociatedStudent" as const,
    id: "stu-002",
    name: "Fatima Hassan",
    avatarUrl: null,
    status: "ACTIVE",
    primaryTeacherId: "teacher-002",
    teacherUserId: "teacher-002",
    teacherName: "Ustadha Sara",
    hoursPerWeek: "2",
    classesRemaining: 8,
    classesTotal: 10,
    language: "ARABIC",
    gender: "FEMALE",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const mockChildQuotas = [
  {
    __typename: "Quota" as const,
    id: "child-quota-001",
    studentId: "stu-001",
    name: "Hifz Package — 20 Classes",
    kind: "PACKAGE",
    totalClasses: 20,
    remaining: 12,
    reservedClasses: 0,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2026-01-01T00:00:00.000Z",
    status: "ACTIVE",
    periodType: null,
    periodDays: null,
    priority: 10,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const mockLedgerRows = [
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-001",
    quotaId: "child-quota-001",
    studentId: "stu-001",
    recurringScheduleId: null,
    classInstanceId: null,
    delta: 20,
    reason: "GRANT",
    reasonNote: "Initial purchase",
    actorUserId: "admin-001",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

export const defaultMocks = [
  {
    request: {
      query: parentAssociatedStudentsQueryDocument,
      variables: { parentId: "parent-001" },
    },
    result: { data: { parentAssociatedStudents: mockChildren } },
  },
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: mockChildQuotas } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "child-quota-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockLedgerRows,
          totalCount: 1,
        },
      },
    },
  },
];

export const emptyMocks = [
  {
    request: {
      query: parentAssociatedStudentsQueryDocument,
      variables: { parentId: "parent-001" },
    },
    result: { data: { parentAssociatedStudents: [] } },
  },
];
