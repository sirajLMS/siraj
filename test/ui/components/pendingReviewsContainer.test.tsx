import { AttendanceEvaluation, LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
}));

mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/dashboard",
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  approveLessonReportMutationDocument,
  pendingLessonReportsQueryDocument,
  rejectLessonReportMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePendingLessonReviewsStore } from "@/frontend/common/stores/pendingLessonReviewsStore";
import { PendingReviewsContainer } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const MOCK_REPORTS = [
  {
    id: "report-1",
    classInstanceId: "cls-1",
    studentId: "student-1",
    teacherId: "teacher-1",
    lessonDate: "2025-01-15T10:00:00Z",
    durationMinutes: 60,
    attendanceEvaluation: AttendanceEvaluation.Present,
    teacherNotes: "Good lesson",
    studentNotes: "",
    completionPercentage: 100,
    status: LessonReportStatus.PendingReview,
    submittedByUserId: "teacher-1",
    submittedAt: "2025-01-15T11:00:00Z",
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: "",
    idempotencyKey: "key-1",
    createdAt: "2025-01-15T11:00:00Z",
    updatedAt: "2025-01-15T11:00:00Z",
  },
  {
    id: "report-2",
    classInstanceId: "cls-2",
    studentId: "student-2",
    teacherId: "teacher-2",
    lessonDate: "2025-01-14T14:00:00Z",
    durationMinutes: 45,
    attendanceEvaluation: AttendanceEvaluation.Late,
    teacherNotes: "Student was late",
    studentNotes: "",
    completionPercentage: 80,
    status: LessonReportStatus.PendingReview,
    submittedByUserId: "teacher-2",
    submittedAt: "2025-01-14T15:00:00Z",
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: "",
    idempotencyKey: "key-2",
    createdAt: "2025-01-14T15:00:00Z",
    updatedAt: "2025-01-14T15:00:00Z",
  },
];

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: pendingLessonReportsQueryDocument,
        variables: {
          teacherId: null,
          studentId: null,
          paginationArgs: { first: 50, page: 1, after: null, before: null, last: null, maxCount: null, skip: null },
        },
      },
      result: { data: { pendingLessonReports: MOCK_REPORTS } },
    },
    {
      request: {
        query: approveLessonReportMutationDocument,
        variables: { reportId: "report-1" },
      },
      result: { data: { approveLessonReport: { ...MOCK_REPORTS[0], status: LessonReportStatus.Approved } } },
    },
    {
      request: {
        query: rejectLessonReportMutationDocument,
        variables: { reportId: "report-2", rejectionReason: "Incomplete" },
      },
      result: {
        data: {
          rejectLessonReport: {
            ...MOCK_REPORTS[1],
            status: LessonReportStatus.Rejected,
            rejectionReason: "Incomplete",
          },
        },
      },
    },
  ];
}

afterEach(() => {
  cleanup();
  usePendingLessonReviewsStore.setState({
    teacherFilter: "",
    studentFilter: "",
    selectedReportId: null,
    rejectDialogOpen: false,
    rejectReason: "",
  });
});

describe("PendingReviewsContainer", () => {
  test("renders pending review rows from mocked query", async () => {
    renderWithWrapper(<PendingReviewsContainer />, {
      locale: "en",
      permissions: [],
      viewport: "desktop",
      mocks: createMocks(),
    });

    await waitFor(() => {
      expect(screen.getByText("Pending Lesson Reviews")).toBeVisible();
    });

    expect(screen.getByText("student-1")).toBeVisible();
    expect(screen.getByText("teacher-1")).toBeVisible();
    expect(screen.getByText("student-2")).toBeVisible();
    expect(screen.getByText("teacher-2")).toBeVisible();
  });

  test("renders an approve button for each pending review row", async () => {
    renderWithWrapper(<PendingReviewsContainer />, {
      locale: "en",
      permissions: [],
      viewport: "desktop",
      mocks: createMocks(),
    });

    const approveButtons = await screen.findAllByRole("button", { name: "Approve" });
    expect(approveButtons).toHaveLength(2);
    expect(approveButtons[0]).toBeVisible();
    expect(approveButtons[1]).toBeVisible();
  });

  test("renders a reject button for each pending review row", async () => {
    renderWithWrapper(<PendingReviewsContainer />, {
      locale: "en",
      permissions: [],
      viewport: "desktop",
      mocks: createMocks(),
    });

    const rejectButtons = await screen.findAllByRole("button", { name: "Reject" });
    expect(rejectButtons).toHaveLength(2);
    expect(rejectButtons[0]).toBeVisible();
    expect(rejectButtons[1]).toBeVisible();
  });
});
