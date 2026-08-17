import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents";
import { ParentQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/ParentQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const t: StudentQuotaLabels = {
  pageTitle: "Children Quotas",
  common: { system: "System", notSet: "Not set" },
  breadcrumbs: { students: "Students", adjustQuota: "Adjust Quota" },
  sections: { studentInfo: "Student Info", courseDetails: "Course Details" },
  fields: {
    studentName: "Student Name",
    studentNamePlaceholder: "Enter student name",
    dateOfBirth: "Date of Birth",
    language: "Language",
    arabic: "Arabic",
    english: "English",
    gender: "Gender",
    male: "Male",
    female: "Female",
    teacher: "Teacher",
    loadingTeachers: "Loading teachers...",
    totalClasses: "Total Classes",
    classesLeft: "Classes Left",
    overrideActive: "Override Active",
    overrideNotice: "Override Notice",
  },
  actions: {
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    saved: "Saved",
    saveSuccess: "Saved successfully",
    lastEditedAt: (time: string) => `Last edited at ${time}`,
  },
  info: {
    quotaTitle: "Quota Title",
    quotaDesc: "Quota Description",
    publicTitle: "Public Title",
    publicDesc: "Public Description",
  },
  validation: {
    nameRequired: "Name is required",
    dobRequired: "Date of birth is required",
    languageRequired: "Language is required",
    genderRequired: "Gender is required",
    teacherRequired: "Teacher is required",
    totalClassesRequired: "Total classes is required",
    totalClassesMin: "Must be at least 1",
    classesLeftRequired: "Classes left is required",
    classesLeftMin: "Must be at least 0",
  },
  errors: { invalidId: "Invalid ID" },
  audience: {
    studentTitle: "My Active Quotas",
    parentTitle: "Children Quotas",
    teacherTitle: "Student Quota Summary",
    supervisorTitle: "Quota Management",
    activeQuotas: "Active Quotas",
    remainingCredits: "Remaining Credits",
    onDemandPending: "On-Demand Pending",
    noChildren: "No children found",
    quotaSummary: "Quota Summary",
    classQuotaUsage: "Class Quota Usage",
    onDemandPendingQueue: "On-Demand Pending Queue",
    classAnalytics: "Class Analytics",
    lowBalanceAlerts: "Low Balance Alerts",
    conflictHeld: "Conflict Held",
    analyticsOverview: "Analytics Overview",
    noData: "No data available",
    noQuotaAssigned: "No quota assigned",
    quotaExhausted: "Quota exhausted",
    eligibleForNextClass: "Eligible for next class",
    notEligibleForNextClass: "Not eligible for next class",
    expiryWarning: (days: number) => `Expires in ${days} days`,
    remainingOfTotal: (remaining: number, total: number) => `${remaining} / ${total}`,
    validPeriod: "Valid Period",
    recentLedgerEntries: "Recent Ledger Entries",
    noLedgerEntries: "No ledger entries",
    loadingData: "Loading data...",
    selectChildPrompt: "Select a child",
    name: "Name",
    kind: "Kind",
    remaining: "Remaining",
    totalClasses: "Total Classes",
    status: "Status",
    validFrom: "Valid From",
    validUntil: "Valid Until",
    delta: "Delta",
    reason: "Reason",
    ledgerDate: "Date",
    createdAt: "Created At",
    newQuota: "New Quota",
    editQuota: "Edit Quota",
    deleteQuota: "Delete Quota",
    statuses: { ACTIVE: "Active", EXPIRED: "Expired", ARCHIVED: "Archived" },
    kinds: { PACKAGE: "Package", PERIODIC: "Periodic" },
    ledgerReasons: {
      ADJUST: "Adjust",
      EXPIRE: "Expire",
      GRANT: "Grant",
      REDEEM: "Redeem",
      RELEASE: "Release",
      RESERVE: "Reserve",
    },
  },
  quotaCount: (count: number) => `${count} quotas`,
};

const mockChild = {
  id: "student-1",
  name: "Child One",
  avatarUrl: null,
  status: "ACTIVE",
  primaryTeacherId: "teacher-1",
  teacherUserId: null,
  teacherName: "Teacher A",
  hoursPerWeek: 4,
  classesRemaining: 10,
  classesTotal: 20,
  language: "ENGLISH",
  gender: "MALE",
  updatedAt: "2025-06-01T00:00:00.000Z",
  __typename: "Student",
};

const mockQuotaRow = {
  id: "quota-1",
  studentId: "student-1",
  name: "Summer Package",
  kind: QuotaKind.Package,
  totalClasses: 20,
  remaining: 15,
  reservedClasses: 2,
  validFrom: "2025-06-01T00:00:00.000Z",
  validUntil: "2025-08-31T00:00:00.000Z",
  status: QuotaStatus.Active,
  periodType: null,
  periodDays: null,
  priority: 10,
  createdAt: "2025-06-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
  __typename: "Quota",
};

const meQueryMock = {
  request: { query: meQueryDocument },
  result: {
    data: {
      me: {
        id: "parent-1",
        name: "Test Parent",
        email: "parent@example.com",
        emailVerifiedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        avatarUrl: null,
        phone: null,
        status: "ACTIVE",
        permissions: [],
        role: "PARENT",
        notificationCount: 0,
        teacherId: null,
        parentId: "parent-1",
        displayCurrency: null,
        __typename: "User",
      },
    },
  },
};

function childrenMock(children: (typeof mockChild)[], loading = false) {
  return {
    request: { query: parentAssociatedStudentsQueryDocument, variables: () => true },
    result: { data: { parentAssociatedStudents: children } },
    delay: loading ? 500 : 0,
  };
}

const studentQuotasMock = {
  request: { query: studentQuotasQueryDocument, variables: () => true },
  result: { data: { studentQuotas: [mockQuotaRow] } },
};

const emptyStudentQuotasMock = {
  request: { query: studentQuotasQueryDocument, variables: () => true },
  result: { data: { studentQuotas: [] } },
};

const ledgerMock = {
  request: { query: quotaLedgerQueryDocument, variables: () => true },
  result: {
    data: {
      quotaLedger: { rows: [], totalCount: 0, __typename: "QuotaLedgerPaginated" },
    },
  },
};

describe("ParentQuotaView", () => {
  afterEach(() => cleanup());

  test("renders child tabs for parent's children", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), studentQuotasMock, ledgerMock]);

    await waitFor(
      () => {
        expect(screen.getAllByText("Child One").length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  const renderParentView = (mocks: MockLink.MockedResponse[]) => {
    renderWithWrapper(<ParentQuotaView t={t} />, {
      locale: "en",
      viewport: "desktop",
      mocks,
    });
  };

  test("renders quota balance card for selected child", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), studentQuotasMock, ledgerMock]);

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
  });

  test("renders no children state when parent has no children", async () => {
    renderParentView([meQueryMock, childrenMock([])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.noChildren)).toBeVisible();
    });
  });

  test("renders loading skeleton while children are loading", async () => {
    renderParentView([meQueryMock, childrenMock([], true)]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.loadingData)).toBeVisible();
    });
  });

  test("renders no quota assigned when child has no quotas", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), emptyStudentQuotasMock, ledgerMock]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.noQuotaAssigned)).toBeVisible();
    });
  });

  test("renders parentTitle as page heading", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), studentQuotasMock, ledgerMock]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.parentTitle)).toBeVisible();
    });
  });
});
