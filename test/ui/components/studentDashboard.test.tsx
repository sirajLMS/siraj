import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/frontend/common/views/dashboard/student/dashboard/studentDashboardView", () => ({
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

mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/students/me/dashboard",
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { studentCreditBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-lms.documents";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { StudentDashboardContainer } from "@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

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

describe("StudentDashboardContainer", () => {
  test("renders next class and recent lesson reports from mocked GraphQL data", async () => {
    useUserStore.setState({ name: "Ahmed Student" });

    renderWithWrapper(<StudentDashboardContainer />, {
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
