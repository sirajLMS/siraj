import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { SupervisorQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const t: StudentQuotaLabels = {
  pageTitle: "Quota Management",
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

const mockQuotaRow = {
  id: "quota-1",
  studentId: "student-1",
  name: "Summer Package",
  kind: "PACKAGE",
  totalClasses: 20,
  remaining: 15,
  reservedClasses: 2,
  validFrom: "2025-06-01T00:00:00.000Z",
  validUntil: "2025-08-31T00:00:00.000Z",
  status: "ACTIVE",
  periodType: null,
  periodDays: null,
  priority: 10,
  createdAt: "2025-06-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
  __typename: "Quota",
};

const quotasMock = {
  request: { query: quotasQueryDocument, variables: () => true },
  result: {
    data: {
      quotas: {
        rows: [mockQuotaRow],
        totalCount: 1,
        __typename: "QuotaPaginated",
      },
    },
  },
};

const emptyQuotasMock = {
  request: { query: quotasQueryDocument, variables: () => true },
  result: {
    data: {
      quotas: { rows: [], totalCount: 0, __typename: "QuotaPaginated" },
    },
  },
};

describe("SupervisorQuotaView", () => {
  afterEach(() => cleanup());

  test("renders supervisor title", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale: "en",
      viewport: "desktop",
      mocks: [quotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText(t.audience.supervisorTitle)).toBeVisible();
    });
  });

  test("renders quota data in grid when quotas exist", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale: "en",
      viewport: "desktop",
      mocks: [quotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
  });

  test("renders no data available when quotas list is empty", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale: "en",
      viewport: "desktop",
      mocks: [emptyQuotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText(t.audience.noData)).toBeVisible();
    });
  });

  test("renders supervisorTitle as page heading", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale: "en",
      viewport: "desktop",
      mocks: [quotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText(t.audience.supervisorTitle)).toBeVisible();
    });
  });
});
