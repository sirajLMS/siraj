import { afterEach, describe, expect, mock, test } from "bun:test";

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

mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/dashboard",
}));

// Bypass ResponsiveViewSwitch / next/dynamic preload races (same pattern as studentDashboard).
mock.module("@/frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer", () => ({
  PendingReviewsContainer: PendingReviewsContainerImpl,
}));

import type { TypedDocumentNode } from "@apollo/client";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { AttendanceEvaluation, LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  approveLessonReportMutationDocument,
  pendingLessonReportsQueryDocument,
  rejectLessonReportMutationDocument,
  studentsDirectoryQueryDocument,
  teachersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePendingLessonReviewsStore } from "@/frontend/common/stores/pendingLessonReviewsStore";
import { useUserAutocompleteStore } from "@/frontend/common/stores/userAutocompleteStore";
import { PendingReviewsContainer as PendingReviewsEntry } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer";
import { usePendingReviewsViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel";
import { PendingReviewsDesktopView } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviews.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function PendingReviewsContainerImpl() {
  const viewModel = usePendingReviewsViewModel({});
  return <PendingReviewsDesktopView {...viewModel} />;
}

const MOCK_REPORTS = [
  {
    id: "report-1",
    classInstanceId: "cls-1",
    studentId: "student-1",
    teacherId: "teacher-1",
    teacherName: "Teacher One",
    studentName: "Student One",
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
    teacherName: "Teacher Two",
    studentName: "Student Two",
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

function pendingLessonReportsMock(): MockLink.MockedResponse {
  return {
    request: {
      query: pendingLessonReportsQueryDocument,
      variables: {
        teacherId: null,
        studentId: null,
        paginationArgs: { first: 25, page: 1, after: null, before: null, last: null, maxCount: null, skip: null },
      },
    },
    result: { data: { pendingLessonReports: { rows: MOCK_REPORTS, totalCount: MOCK_REPORTS.length } } },
  };
}

function makeTeacherRow(id: string, name: string) {
  return { id, name, avatarUrl: null };
}

function makeStudentRow(id: string, name: string) {
  return {
    id,
    name,
    email: null,
    avatarUrl: null,
    status: "ACTIVE",
    classesRemaining: null,
    classesTotal: null,
    hoursPerWeek: null,
    teacherName: null,
    createdAt: null,
    updatedAt: null,
  };
}

function makeAutocompleteMock<TData, TVariables extends { search?: string | null; limit?: number }>(
  queryDoc: TypedDocumentNode<TData, TVariables>,
  dataKey: string,
  rowFactory: (id: string, name: string) => { id: string; name: string },
  items: { id: string; name: string }[],
  searchValue: string | null
): MockLink.MockedResponse {
  return {
    request: {
      query: queryDoc,
      variables: { search: searchValue, limit: USER_SELECT_LIMIT },
    },
    result: {
      data: {
        [dataKey]: items.map(item => rowFactory(item.id, item.name)),
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function makeTeachersMock(): MockLink.MockedResponse {
  return makeAutocompleteMock(
    teachersQueryDocument,
    "teachers",
    makeTeacherRow,
    [
      { id: "teacher-1", name: "Teacher One" },
      { id: "teacher-2", name: "Teacher Two" },
    ],
    ""
  );
}

function makeStudentsDirectoryMock(): MockLink.MockedResponse {
  return makeAutocompleteMock(
    studentsDirectoryQueryDocument,
    "studentsDirectory",
    makeStudentRow,
    [
      { id: "student-1", name: "Student One" },
      { id: "student-2", name: "Student Two" },
    ],
    null
  );
}

function approveLessonReportMock(): MockLink.MockedResponse {
  return {
    request: {
      query: approveLessonReportMutationDocument,
      variables: { reportId: "report-1" },
    },
    result: { data: { approveLessonReport: { ...MOCK_REPORTS[0], status: LessonReportStatus.Approved } } },
  };
}

function rejectLessonReportMock(): MockLink.MockedResponse {
  return {
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
  };
}

function createMocks(): MockLink.MockedResponse[] {
  return [
    pendingLessonReportsMock(),
    makeTeachersMock(),
    makeStudentsDirectoryMock(),
    // cache-and-network in autocomplete hooks can issue multiple requests per render
    makeTeachersMock(),
    makeStudentsDirectoryMock(),
    approveLessonReportMock(),
    rejectLessonReportMock(),
  ];
}

afterEach(() => {
  cleanup();
  useUserAutocompleteStore.setState({
    byAudience: {
      teacher: {},
      student: {},
      parent: {},
      user: {},
      staff: {},
    },
  });
  usePendingLessonReviewsStore.setState({
    selectedTeacher: null,
    studentFilter: null,
    selectedReportId: null,
    rejectDialogOpen: false,
    rejectReason: "",
    page: 0,
    pageSize: 25,
  });
});

describe("PendingReviewsContainer", () => {
  test("renders pending review rows with teacher/student names, filters, and totalCount", async () => {
    renderWithWrapper(<PendingReviewsEntry />, {
      locale: "en",
      permissions: [],
      viewport: "desktop",
      mocks: createMocks(),
    });

    await screen.findByText("Pending Lesson Reviews");

    // Name columns (not raw UUIDs)
    expect(await screen.findByText("Student One")).toBeVisible();
    expect(await screen.findByText("Teacher One")).toBeVisible();
    expect(await screen.findByText("Student Two")).toBeVisible();
    expect(await screen.findByText("Teacher Two")).toBeVisible();
    expect(screen.queryByText("student-1")).not.toBeInTheDocument();
    expect(screen.queryByText("teacher-1")).not.toBeInTheDocument();

    // Filter Autocomplete fields
    expect(screen.getByLabelText("Filter by Teacher")).toBeVisible();
    expect(screen.getByLabelText("Filter by Student")).toBeVisible();

    // Server pagination driven by totalCount (2 rows)
    await waitFor(() => {
      expect(screen.getByText(/1[–-]2 of 2/i)).toBeVisible();
    });
  });

  async function renderAndFindReviewButtons(buttonName: string): Promise<HTMLElement[]> {
    renderWithWrapper(<PendingReviewsEntry />, {
      locale: "en",
      permissions: [],
      viewport: "desktop",
      mocks: createMocks(),
    });

    const buttons = await screen.findAllByRole("button", { name: buttonName });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeVisible();
    expect(buttons[1]).toBeVisible();
    return buttons;
  }

  test("renders an approve button for each pending review row", async () => {
    await renderAndFindReviewButtons("Approve");
  });

  test("renders a reject button for each pending review row", async () => {
    await renderAndFindReviewButtons("Reject");
  });
});
