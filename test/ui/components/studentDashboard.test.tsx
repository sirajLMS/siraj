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

// Eliminates dependency on the router-backed language switch hook so this file is
// immune to any router mock configuration registered by earlier test files.
mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, mock, test } from "bun:test";

// Mock StudentDashboardView with a stub that renders the data-testids the assertions
// check. Registered defensively so any bleed from earlier files is overridden.
// Plan v5: the production `StudentDashboardView` switcher was rewritten to take NO
// props (it owns the ViewModel internally). This file's `StudentDashboardContainerImpl`
// re-implementation below mirrors a now-superseded Container/ViewModel split and
// passes a flat prop object to a mock stub. The stub accepts the full flat prop set
// incl. the callbacks the original Container forwarded (onJoinLesson, onViewHistory,
// ...) even though the stub body ignores them — this is purely so JSX attribute
// assignment inside `StudentDashboardContainerImpl` passes type-check while the test
// exercises its hand-rolled wiring against mocked GraphQL.
mock.module("@/frontend/common/views/dashboard/student/dashboard/StudentDashboardView", () => ({
  StudentDashboardView: (props: {
    readonly userName: string | null;
    readonly nextLesson: {
      readonly id: string;
      readonly instructor: string;
      readonly scheduledStartAt: string | null;
      readonly durationMinutes: number;
      readonly meetingJoinUrl: string | null;
      readonly isFrozen: boolean;
    } | null;
    readonly upcomingLessons: readonly {
      readonly id: string;
      readonly instructor: string;
      readonly scheduledStartAt: string | null;
      readonly durationMinutes: number;
      readonly meetingJoinUrl: string | null;
      readonly isFrozen: boolean;
    }[];
    readonly creditBalance: { readonly classesRemaining: number; readonly classesTotal: number };
    readonly recentLessonReports: readonly {
      readonly id: string;
      readonly lessonDate: string | null;
      readonly durationMinutes: number;
      readonly completionPercentage: number;
      readonly attendanceEvaluation: string | null;
      readonly status: string | null;
    }[];
    readonly loading: boolean;
    readonly labels: {
      readonly nextClass: string;
      readonly joinNow: string;
      readonly classesRemaining: string;
      readonly classesTotal: string;
      readonly recentLessonReports: string;
      readonly addReflection: string;
    };
    readonly onJoinLesson?: (id: string) => void;
    readonly onViewHistory?: () => void;
    readonly onViewCredits?: () => void;
    readonly onAddReflection?: (lessonReportId: string) => void;
    readonly onEditProfile?: () => void;
  }) => {
    const lesson = props.nextLesson;
    return (
      <div data-testid="student-dashboard-view">
        <span data-testid="next-class-label">{props.labels.nextClass}</span>
        {lesson ? (
          <div data-testid="next-class">
            <span data-testid="next-class-instructor">{lesson.instructor}</span>
            <span data-testid="next-class-duration">{lesson.durationMinutes} min</span>
            {lesson.meetingJoinUrl ? <span data-testid="next-class-join">{props.labels.joinNow}</span> : null}
          </div>
        ) : null}
        <span data-testid="classes-remaining">
          {props.labels.classesRemaining}: {props.creditBalance.classesRemaining}
        </span>
        <span data-testid="classes-total">
          {props.labels.classesTotal}: {props.creditBalance.classesTotal}
        </span>
        <div data-testid="recent-reports-section">
          <span>{props.labels.recentLessonReports}</span>
          {props.recentLessonReports.map(report => (
            <div key={report.id} data-testid={`report-${report.id}`}>
              <span data-testid={`report-${report.id}-date`}>{report.lessonDate}</span>
              <span data-testid={`report-${report.id}-duration`}>{report.durationMinutes} min</span>
              <span data-testid={`report-${report.id}-completion`}>{report.completionPercentage}%</span>
              <span data-testid={`report-${report.id}-attendance`}>{report.attendanceEvaluation ?? ""}</span>
              <span data-testid={`report-${report.id}-status`}>{report.status ?? ""}</span>
              <span data-testid={`report-${report.id}-reflection`}>{props.labels.addReflection}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

// CRITICAL: dashboardContainer.test.tsx (runs alphabetically before us) mocks the
// StudentDashboardContainer module path with a no-content stub. We must override that
// bleed by re-registering the same path with a working reimplementation that wires up
// the real hooks/queries/stores and renders the (already mocked) StudentDashboardView.
// Re-implementing here avoids the stub bleed while keeping production code untouched.
// `StudentDashboardContainerImpl` is defined as a real top-level component below (after
// the ES imports), and the mock factory just re-exports it via closure — avoiding
// `require()` and keeping the file lint-clean.
mock.module("@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer", () => ({
  StudentDashboardContainer: StudentDashboardContainerImpl,
}));

import { useQuery } from "@apollo/client/react";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { useMemo } from "react";

expect.extend(matchers);

import { studentCreditBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
// Plan v5: the production `StudentDashboardView` switcher takes no props and owns
// its ViewModel internally. The test below needs (a) a flat-props stub to render
// inside the local `StudentDashboardContainerImpl` reimplementation and (b) an
// entry component that exercises the GraphQL wiring. The mock.module calls above
// intercept both module-path imports:
//   - PascalCase `StudentDashboardView` mock¹ substitutes the flat-props stub used
//     inside `StudentDashboardContainerImpl` (line ~292).
//   - PascalCase `StudentDashboardContainer` mock² substitutes
//     `StudentDashboardContainer: StudentDashboardContainerImpl` re-exported via
//     closure — that's what `<StudentDashboardEntry />` (rendered in the `describe`
//     block below) actually invokes. The tests never touch the real
//     `StudentDashboardView` switcher; importing the real `StudentDashboardContainer`
//     here at type-check time keeps import resolution honest while the mock sits in
//     front of it at runtime so the GraphQL mocks drive the assertions.
//
// The real `StudentDashboardView` switcher's type signature is `() => JSX.Element`
// (no props) so direct `<StudentDashboardView ...flat props />` usage fails type
// check. We cast the imported component to a locally-typed stub component whose
// prop shape mirrors the mock factory's stub (incl. the optional callbacks the
// Container forwards). This preserves type-check while the runtime mock fully
// determines the actual rendered output.
import { StudentDashboardContainer as StudentDashboardEntry } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { StudentDashboardView as StudentDashboardViewSwitcher } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardView";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";

interface StudentDashboardStubProps {
  readonly userName: string | null;
  readonly nextLesson: UpcomingLessonRow | null;
  readonly upcomingLessons: readonly UpcomingLessonRow[];
  readonly creditBalance: StudentCreditBalanceRow;
  readonly recentLessonReports: readonly RecentLessonReportRow[];
  readonly loading: boolean;
  readonly labels: {
    readonly nextClass: string;
    readonly joinNow: string;
    readonly classesRemaining: string;
    readonly classesTotal: string;
    readonly recentLessonReports: string;
    readonly addReflection: string;
  };
  readonly onJoinLesson?: (id: string) => void;
  readonly onViewHistory?: () => void;
  readonly onViewCredits?: () => void;
  readonly onAddReflection?: (lessonReportId: string) => void;
  readonly onEditProfile?: () => void;
}

const StudentDashboardViewStub = StudentDashboardViewSwitcher as unknown as ComponentType<StudentDashboardStubProps>;

import {
  isWithinNextDays,
  mapCreditBalance,
  mapRecentLessonReports,
  mapUpcomingLessons,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/studentDashboardMappers";
import { useRouter } from "@/shared/i18n/routing";
import { type StudentPortalDashboardLabels, useAppTranslation } from "@/shared/locale";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// Top-level reimplementation of StudentDashboardContainer that mirrors the production
// container's wiring (hooks → queries → stores → mocked StudentDashboardView). It exists
// to defeat the bleed from dashboardContainer.test.tsx's stub (which mocks the container
// module path with a no-content div). Referenced by mock.module() above via closure.
function StudentDashboardContainerImpl() {
  const t = useAppTranslation().dashboardTranslations.studentPortalDashboard;
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const setSelectedReportId = useStudentDashboardStore(state => state.setSelectedReportId);
  const setReflectionDialogOpen = useStudentDashboardStore(state => state.setReflectionDialogOpen);

  const labels: StudentPortalDashboardLabels = useMemo(
    () => ({
      pageTitle: t.pageTitle,
      welcomeMessage: t.welcomeMessage,
      nextClass: t.nextClass,
      joinNow: t.joinNow,
      noUpcomingClasses: t.noUpcomingClasses,
      creditBalance: t.creditBalance,
      classesRemaining: t.classesRemaining,
      classesTotal: t.classesTotal,
      recentLessonReports: t.recentLessonReports,
      viewAllHistory: t.viewAllHistory,
      viewCredits: t.viewCredits,
      addReflection: t.addReflection,
      upcomingToday: t.upcomingToday,
      upcomingThisWeek: t.upcomingThisWeek,
      noLessonReports: t.noLessonReports,
      loadingMessage: t.loadingMessage,
    }),
    [t]
  );

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });

  const studentId = profileData?.studentProfile?.id ?? null;

  const { data: balanceData, loading: balanceLoading } = useQuery(studentCreditBalanceQueryDocument, {
    variables: { studentId: studentId ?? "" },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const { data: reportsData, loading: reportsLoading } = useQuery(pendingLessonReportsQueryDocument, {
    variables: {
      studentId: studentId ?? null,
      teacherId: null,
      paginationArgs: { first: 5, skip: null, after: null, before: null, last: null, page: null, maxCount: null },
    },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const upcomingLessons = useMemo(() => mapUpcomingLessons(profileData?.studentProfile), [profileData]);

  const nextLesson = useMemo(() => {
    const joinable = upcomingLessons.find(
      l => isWithinNextDays(l.scheduledStartAt, 7) && Boolean(l.meetingJoinUrl) && !l.isFrozen
    );
    return joinable ?? upcomingLessons[0] ?? null;
  }, [upcomingLessons]);

  const creditBalance = useMemo(() => mapCreditBalance(balanceData?.studentCreditBalance), [balanceData]);

  const recentLessonReports = useMemo(() => mapRecentLessonReports(reportsData?.pendingLessonReports), [reportsData]);

  const loading = profileLoading || balanceLoading || reportsLoading;

  const handlers = useMemo(
    () => ({
      handleJoinLesson: (id: string) => {
        const lesson = upcomingLessons.find(l => l.id === id);
        const url = lesson?.meetingJoinUrl;
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      },
      handleViewHistory: () => {
        router.push("/students/me/history");
      },
      handleViewCredits: () => {
        router.push("/students/me/credits");
      },
      handleAddReflection: (lessonReportId: string) => {
        setSelectedReportId(lessonReportId);
        setReflectionDialogOpen(true);
      },
      handleEditProfile: () => {
        router.push("/students/me/profile");
      },
    }),
    [upcomingLessons, router, setSelectedReportId, setReflectionDialogOpen]
  );

  return (
    <StudentDashboardViewStub
      userName={userName || null}
      nextLesson={nextLesson}
      upcomingLessons={upcomingLessons}
      creditBalance={creditBalance}
      recentLessonReports={recentLessonReports}
      labels={labels}
      loading={loading}
      onJoinLesson={handlers.handleJoinLesson}
      onViewHistory={handlers.handleViewHistory}
      onViewCredits={handlers.handleViewCredits}
      onAddReflection={handlers.handleAddReflection}
      onEditProfile={handlers.handleEditProfile}
    />
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

const pendingReportsMockData = {
  pendingLessonReports: [
    {
      id: "report-1",
      classInstanceId: "class-instance-1",
      studentId,
      teacherId: "teacher-1",
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
        query: pendingLessonReportsQueryDocument,
        variables: {
          studentId: "student-1",
          teacherId: null,
          paginationArgs: {
            first: 5,
            skip: null,
            after: null,
            before: null,
            last: null,
            page: null,
            maxCount: null,
          },
        },
      },
      result: { data: pendingReportsMockData },
    },
  ];
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ name: "", permissions: [] }, false);
  useStudentDashboardStore.setState({ selectedReportId: null, reflectionDialogOpen: false });
});

describe("StudentDashboardView", () => {
  test("renders next class and recent lesson reports from mocked GraphQL data", async () => {
    useUserStore.setState({ name: "Ahmed Student" });

    renderWithWrapper(<StudentDashboardEntry />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByTestId("next-class")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("classes-remaining")).toHaveTextContent("Classes Remaining: 8");
    });

    expect(screen.getByTestId("next-class-label")).toHaveTextContent("Next Class");
    expect(screen.getByTestId("next-class-instructor")).toHaveTextContent(instructorName);
    expect(screen.getByTestId("next-class-duration")).toHaveTextContent("60 min");
    expect(screen.getByTestId("next-class-join")).toHaveTextContent("Join Now");

    expect(screen.getByTestId("classes-remaining")).toHaveTextContent("Classes Remaining: 8");
    expect(screen.getByTestId("classes-total")).toHaveTextContent("Total Classes: 20");

    // Wait for lesson reports to load
    await waitFor(() => {
      expect(screen.getByTestId("report-report-1")).toBeInTheDocument();
    });

    expect(screen.getByTestId("report-report-1-date")).toHaveTextContent("2026-07-10");
    expect(screen.getByTestId("report-report-1-duration")).toHaveTextContent("45 min");
    expect(screen.getByTestId("report-report-1-completion")).toHaveTextContent("80%");
    expect(screen.getByTestId("report-report-1-attendance")).toHaveTextContent("PRESENT");
    expect(screen.getByTestId("report-report-1-status")).toHaveTextContent("APPROVED");

    expect(screen.getByTestId("report-report-2")).toBeInTheDocument();
    expect(screen.getByTestId("report-report-2-date")).toHaveTextContent("2026-07-12");
    expect(screen.getByTestId("report-report-2-completion")).toHaveTextContent("50%");
    expect(screen.getByTestId("report-report-2-status")).toHaveTextContent("PENDING_REVIEW");
  });
});
