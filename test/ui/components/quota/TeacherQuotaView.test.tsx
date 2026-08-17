import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers";
import { TeacherQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const t: StudentQuotaLabels = {
  pageTitle: "Student Quota Summary",
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

function assignedStudentsMock(rows: Record<string, unknown>[], loading = false) {
  return {
    request: { query: teacherAssignedStudentsQueryDocument },
    result: {
      data: {
        teacherAssignedStudents: {
          id: "teacher-1",
          totalCount: rows.length,
          rows,
          __typename: "TeacherAssignedStudents",
        },
      },
    },
    delay: loading ? 500 : 0,
  };
}

const mockEligibleStudent = {
  id: "student-1",
  name: "Alice",
  status: "ACTIVE",
  hoursPerWeek: 4,
  classesRemaining: 10,
  classesTotal: 20,
  __typename: "Student",
};

const mockExhaustedStudent = {
  id: "student-2",
  name: "Bob",
  status: "ACTIVE",
  hoursPerWeek: 2,
  classesRemaining: 0,
  classesTotal: 15,
  __typename: "Student",
};

describe("TeacherQuotaView", () => {
  afterEach(() => cleanup());

  function renderTeacherView(mocks: ReturnType<typeof assignedStudentsMock>[]) {
    renderWithWrapper(<TeacherQuotaView t={t} />, {
      locale: "en",
      viewport: "desktop",
      mocks,
    });
  }

  test("renders student rows for teacher's assigned students", async () => {
    renderTeacherView([assignedStudentsMock([mockEligibleStudent, mockExhaustedStudent])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.teacherTitle)).toBeVisible();
    });

    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.getByText("Bob")).toBeVisible();
  });

  test("renders no data when teacher has no assigned students", async () => {
    renderTeacherView([assignedStudentsMock([])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.noData)).toBeVisible();
    });
  });

  test("renders loading state while students are loading", async () => {
    renderTeacherView([assignedStudentsMock([], true)]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.loadingData)).toBeVisible();
    });
  });

  test("uses teacherTitle as page title", async () => {
    renderTeacherView([assignedStudentsMock([mockEligibleStudent])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.teacherTitle)).toBeVisible();
    });
  });

  test("renders eligible student with eligibility label", async () => {
    renderTeacherView([assignedStudentsMock([mockEligibleStudent])]);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeVisible();
    });

    expect(screen.getByText(t.audience.eligibleForNextClass)).toBeVisible();
  });

  test("renders exhausted student with not-eligible label", async () => {
    renderTeacherView([assignedStudentsMock([mockExhaustedStudent])]);

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeVisible();
    });

    expect(screen.getByText(t.audience.notEligibleForNextClass)).toBeVisible();
  });
});
