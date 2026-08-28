import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import {
  TEACHER_LESSON_REPORTS_DEFAULT_STATUS_FILTER,
  useTeacherLessonReportsStore,
} from "@/frontend/common/stores/teacherLessonReportsStore";
import { useTeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const TEACHER_ID = "teacher-1";

const REPORTS = [
  {
    id: "report-1",
    classInstanceId: "class-1",
    studentId: "student-1",
    teacherId: TEACHER_ID,
    teacherName: "Teacher One",
    studentName: "Student One",
    subjectName: "Math",
    classAvatarUrl: null,
    teacherAvatarUrl: null,
    studentAvatarUrl: null,
    teacherUserId: null,
    studentUserId: null,
    lessonDate: "2026-02-02T10:00:00.000Z",
    durationMinutes: 60,
    attendanceEvaluation: null,
    teacherNotes: "Covered grammar basics.",
    studentNotes: "",
    completionPercentage: 80,
    status: LessonReportStatus.Approved,
    submittedByUserId: TEACHER_ID,
    submittedAt: "2026-02-02T11:00:00.000Z",
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: null,
    idempotencyKey: "key-1",
    createdAt: "2026-02-02T11:00:00.000Z",
    updatedAt: "2026-02-02T11:00:00.000Z",
  },
  {
    id: "report-2",
    classInstanceId: "class-2",
    studentId: "student-2",
    teacherId: TEACHER_ID,
    teacherName: "Teacher Two",
    studentName: "Student Two",
    subjectName: "Science",
    classAvatarUrl: null,
    teacherAvatarUrl: null,
    studentAvatarUrl: null,
    teacherUserId: null,
    studentUserId: null,
    lessonDate: "2026-02-03T14:00:00.000Z",
    durationMinutes: 45,
    attendanceEvaluation: null,
    teacherNotes: "Needs more practice.",
    studentNotes: "",
    completionPercentage: 55,
    status: LessonReportStatus.PendingReview,
    submittedByUserId: TEACHER_ID,
    submittedAt: "2026-02-03T15:00:00.000Z",
    reviewedByUserId: null,
    reviewedAt: null,
    rejectionReason: null,
    idempotencyKey: "key-2",
    createdAt: "2026-02-03T15:00:00.000Z",
    updatedAt: "2026-02-03T15:00:00.000Z",
  },
];

function pendingReportsMock(): MockLink.MockedResponse {
  return {
    request: {
      query: pendingLessonReportsQueryDocument,
      variables: { teacherId: TEACHER_ID, studentId: null, paginationArgs: null },
    },
    result: { data: { pendingLessonReports: { rows: REPORTS, totalCount: REPORTS.length } } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function ViewModelProbe() {
  const viewModel = useTeacherLessonReportsViewModel({ teacherId: TEACHER_ID });
  return (
    <div>
      <output data-testid="status-filter">{viewModel.statusFilter}</output>
      <output data-testid="rows">{viewModel.rows.map(row => `${row.id}:${row.status}`).join("|")}</output>
    </div>
  );
}

async function waitForRowsToContain(fragment: string): Promise<HTMLElement> {
  const rowsOutput = await screen.findByTestId("rows");
  await waitFor(() => expect(rowsOutput.textContent).toContain(fragment));
  return rowsOutput;
}

afterEach(() => {
  cleanup();
  useTeacherLessonReportsStore.setState({ statusFilter: TEACHER_LESSON_REPORTS_DEFAULT_STATUS_FILTER });
});

describe("useTeacherLessonReportsViewModel", () => {
  test("returns every fetched row for the teacher when the store filter is ALL", async () => {
    renderWithWrapper(<ViewModelProbe />, { locale, mocks: [pendingReportsMock()] });

    const rowsOutput = await waitForRowsToContain("report-1:APPROVED");
    expect(rowsOutput.textContent).toContain("report-2:PENDING_REVIEW");
    expect(screen.getByTestId("status-filter").textContent).toBe("ALL");
  });

  test("filters the queried rows when the store filter changes", async () => {
    renderWithWrapper(<ViewModelProbe />, { locale, mocks: [pendingReportsMock()] });

    await waitForRowsToContain("report-2");

    act(() => {
      useTeacherLessonReportsStore.getState().setStatusFilter(LessonReportStatus.Approved);
    });

    const rowsOutput = await waitForRowsToContain("report-1:APPROVED");
    expect(rowsOutput.textContent).not.toContain("report-2");
    expect(screen.getByTestId("status-filter").textContent).toBe(LessonReportStatus.Approved);
  });

  test("keeps the store filter when the view unmounts and remounts (tier switch)", async () => {
    const { unmount } = renderWithWrapper(<ViewModelProbe />, { locale, mocks: [pendingReportsMock()] });

    await waitForRowsToContain("report-1");
    act(() => {
      useTeacherLessonReportsStore.getState().setStatusFilter(LessonReportStatus.Rejected);
    });
    expect(screen.getByTestId("status-filter").textContent).toBe(LessonReportStatus.Rejected);
    await waitFor(() => expect(screen.getByTestId("rows").textContent).not.toContain("report-1"));

    unmount();
    renderWithWrapper(<ViewModelProbe />, { locale, mocks: [pendingReportsMock()] });

    expect(screen.getByTestId("status-filter").textContent).toBe(LessonReportStatus.Rejected);
    await waitFor(async () => {
      const rowsOutput = await screen.findByTestId("rows");
      expect(rowsOutput.textContent).not.toContain("report-1");
      expect(rowsOutput.textContent).not.toContain("report-2");
    });
  });
});
