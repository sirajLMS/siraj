// Defensive mocks against bleed from earlier test files.
// Bun's mock.module() is process-global, so mocks registered by alphabetically-earlier
// test files bleed into this file:
//   - dashboardContainer.test.tsx mocks the StudentDashboardContainer module path itself
//     with a stub returning <div data-testid="student-dashboard">Student Dashboard</div>,
//     which would override our real container import and break every assertion below.
//   - ScheduleOverviewSection.test.tsx mocks next/navigation, @/shared/i18n/routing,
//     RequirePermission, and scheduleOverviewView.
// Re-registering here ensures our file gets the shape it requires, regardless of what
// earlier files left behind. The LAST mock.module registration for a given path wins.

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/students/me/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

mock.module("@/shared/i18n/routing", () => ({
  locales: ["ar", "en"] as const,
  defaultLocale: "en",
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/students/me/dashboard",
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/students/me/dashboard",
}));

// Eliminates dependency on the router-backed language switch hook so this file is
// immune to any router mock configuration registered by earlier test files.
mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import { Fragment } from "react";

// CRITICAL: dashboardContainer.test.tsx (runs alphabetically before us) stubs
// StudentDashboardContainer. Re-register with a thin wrapper that mirrors production
// (ViewModel + desktop tier + ReflectionDialog) so GraphQL mocks drive real UI.
// `StudentDashboardContainerImpl` is defined below; the mock factory re-exports it
// via closure — avoiding `require()` and keeping the file lint-clean.
mock.module("@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer", () => ({
  StudentDashboardContainer: StudentDashboardContainerImpl,
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { studentCreditBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { studentRecentLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ReflectionDialog } from "@/frontend/common/views/dashboard/student/dashboard/components/ReflectionDialog";
import { StudentDashboardContainer as StudentDashboardEntry } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { useStudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { StudentDashboardDesktopView } from "@/frontend/desktop/views/dashboard/student/dashboard/studentDashboard.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

/**
 * Production-shaped container for desktop viewport tests.
 * Defeats the no-content stub bleed from dashboardContainer.test.tsx while
 * exercising the real ViewModel and desktop dashboard UI.
 */
function StudentDashboardContainerImpl() {
  const viewModel = useStudentDashboardViewModel({});
  return (
    <Fragment>
      <StudentDashboardDesktopView {...viewModel} />
      <ReflectionDialog />
    </Fragment>
  );
}

const studentId = "student-1";
const instructorName = "Ustadh Yusuf";

function futureISOString(): string {
  const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return future.toISOString();
}

const upcomingStartAt = futureISOString();
const meetingJoinUrl = "https://meet.example.com/lesson/1";

const profileMockData = {
  studentProfile: {
    id: studentId,
    name: "Ahmed Student",
    status: "ACTIVE",
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    language: null,
    parentId: null,
    parentUserId: null,
    parentName: null,
    isAssociatedViewer: true,
    primaryTeacherId: "teacher-1",
    teacherUserId: "teacher-1",
    teacherName: instructorName,
    hoursPerWeek: 4,
    classesRemaining: 12,
    classesTotal: 16,
    version: 1,
    createdAt: null,
    updatedAt: null,
    upcomingClasses: {
      id: "upcoming-1",
      studentId,
      studentName: "Ahmed Student",
      status: "ACTIVE",
      classes: [
        {
          id: "class-1",
          instructor: instructorName,
          teacherId: "teacher-1",
          scheduledStartAt: upcomingStartAt,
          scheduledEndAt: null,
          durationMinutes: 60,
          executionState: "NOT_ACTIVATED",
          outcome: "PENDING",
          isFrozen: false,
          meetingJoinUrl,
          effectiveMeeting: {
            joinUrl: meetingJoinUrl,
            providerSlug: "zoom",
            providerName: { ar: "زوم", en: "Zoom" },
            logoUrl: null,
            meetingId: "mtg-1",
            source: "CONFIG",
            configId: "config-1",
            providerId: "provider-1",
          },
        },
      ],
    },
    classHistory: null,
  },
};

const creditBalanceMockData = {
  studentCreditBalance: {
    studentId,
    classesRemaining: 8,
    classesTotal: 20,
  },
};

const recentReportsMockData = {
  studentRecentLessonReports: {
    totalCount: 2,
    rows: [
      {
        id: "report-1",
        classInstanceId: "class-instance-1",
        studentId,
        teacherId: "teacher-1",
        teacherName: null,
        studentName: null,
        subjectName: null,
        classAvatarUrl: null,
        teacherAvatarUrl: null,
        studentAvatarUrl: null,
        teacherUserId: "teacher-1",
        studentUserId: studentId,
        lessonDate: "2026-07-10",
        durationMinutes: 45,
        attendanceEvaluation: "PRESENT",
        teacherNotes: "Good progress",
        studentNotes: null,
        completionPercentage: 80,
        status: "APPROVED",
        submittedByUserId: "teacher-1",
        submittedAt: null,
        reviewedByUserId: null,
        reviewedAt: null,
        rejectionReason: null,
        idempotencyKey: "key-1",
        createdAt: null,
        updatedAt: null,
      },
      {
        id: "report-2",
        classInstanceId: "class-instance-2",
        studentId,
        teacherId: "teacher-1",
        teacherName: null,
        studentName: null,
        subjectName: null,
        classAvatarUrl: null,
        teacherAvatarUrl: null,
        studentAvatarUrl: null,
        teacherUserId: "teacher-1",
        studentUserId: studentId,
        lessonDate: "2026-07-12",
        durationMinutes: 60,
        attendanceEvaluation: "LATE",
        teacherNotes: null,
        studentNotes: null,
        completionPercentage: 50,
        status: "PENDING_REVIEW",
        submittedByUserId: "teacher-1",
        submittedAt: null,
        reviewedByUserId: null,
        reviewedAt: null,
        rejectionReason: null,
        idempotencyKey: "key-2",
        createdAt: null,
        updatedAt: null,
      },
    ],
  },
};

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: studentProfileQueryDocument,
        variables: { studentId: null, year: null, month: null },
      },
      result: { data: profileMockData },
    },
    {
      request: {
        query: studentCreditBalanceQueryDocument,
        variables: { studentId: "student-1" },
      },
      result: { data: creditBalanceMockData },
    },
    {
      request: {
        query: studentRecentLessonReportsQueryDocument,
        variables: {
          paginationArgs: {
            page: 1,
            first: 5,
            skip: null,
            after: null,
            before: null,
            last: null,
            maxCount: null,
          },
        },
      },
      result: { data: recentReportsMockData },
    },
  ];
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ name: "", permissions: [] }, false);
  useStudentDashboardStore.setState({
    selectedReportId: null,
    reflectionDialogOpen: false,
    page: 0,
    pageSize: 5,
    reportsTotalCount: 0,
  });
});

describe("StudentDashboardContainer", () => {
  test("renders next class, credits, and recent lesson reports from mocked GraphQL data", async () => {
    useUserStore.setState({ name: "Ahmed Student" });

    renderWithWrapper(<StudentDashboardEntry />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText("Next Class")).toBeInTheDocument();
    });

    expect(screen.getByText("Welcome, Ahmed Student")).toBeInTheDocument();
    // Instructor and Join appear in both Next Class card and Today's Classes list.
    expect(screen.getAllByText(instructorName).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: "Join" }).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getByText("Classes Remaining")).toBeInTheDocument();
    });
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Total Classes")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("20 total classes")).toBeInTheDocument();

    const firstLessonDate = formatDate("2026-07-10", "en");
    const secondLessonDate = formatDate("2026-07-12", "en");

    await waitFor(() => {
      expect(screen.getByText(firstLessonDate)).toBeInTheDocument();
    });

    expect(screen.getByText("Recent Lesson Reports")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "View All History" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/45\s*min\s*·\s*80%\s*·\s*PRESENT/)).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText(secondLessonDate)).toBeInTheDocument();
    expect(screen.getByText(/60\s*min\s*·\s*50%\s*·\s*LATE/)).toBeInTheDocument();
    expect(screen.getByText("PENDING_REVIEW")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add Reflection" })).toHaveLength(2);
  });
});
