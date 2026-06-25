mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}) }),
  useParams: () => ({ locale: "ar" }),
  usePathname: () => "/ar/dashboard",
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { ScheduleOverviewDataGrid } from "@/frontend/views/dashboard/dashboard/components/ScheduleOverviewDataGrid";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const statusLabels: Record<ClassOutcome | ClassExecutionState, string> = {
  [ClassOutcome.Pending]: "Pending",
  [ClassOutcome.Taken]: "Taken",
  [ClassOutcome.Absent]: "Absent",
  [ClassOutcome.Leave]: "Leave",
  [ClassExecutionState.NotActivated]: "Not Activated",
  [ClassExecutionState.Activated]: "Activated",
  [ClassExecutionState.Running]: "Running",
  [ClassExecutionState.Completed]: "Completed",
};

const headers = {
  classId: "Class ID",
  student: "Student",
  teacher: "Teacher",
  time: "Time",
  yourTime: "Your Time",
  teacherTime: "Teacher Time",
  studentTime: "Student Time",
  status: "Status",
  actions: "Actions",
};

const mockRows: readonly DailyScheduleRow[] = [
  {
    id: "row-1",
    yourTime: "10:00 AM",
    teacherTime: "11:00 AM",
    studentTime: "10:00 AM",
    duration: 60,
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.NotActivated,
    student: { id: "student-1", name: "Ahmed Hassan" },
    teacher: { id: "teacher-1", name: "Dr. Sarah" },
  },
  {
    id: "row-2",
    yourTime: "2:00 PM",
    teacherTime: "3:00 PM",
    studentTime: "2:00 PM",
    duration: 60,
    outcome: ClassOutcome.Taken,
    executionState: ClassExecutionState.Completed,
    student: { id: "student-2", name: "Fatima Ali" },
    teacher: { id: "teacher-2", name: "Mr. Omar" },
  },
];

const defaultPaginationProps = {
  page: 0,
  pageSize: 10,
  totalCount: mockRows.length,
  onPageChange: mock(() => {}),
};

describe("ScheduleOverviewDataGrid", () => {
  test("shows timezone columns with ScheduleViewTimezones permission", () => {
    renderWithWrapper(
      <ScheduleOverviewDataGrid
        rows={mockRows}
        {...defaultPaginationProps}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel="View Details"
        emptyMessage="No classes scheduled"
      />,
      { permissions: [AppPermission.ScheduleViewTimezones] }
    );

    expect(screen.getByText("Your Time")).toBeVisible();
    expect(screen.getByText("Teacher Time")).toBeVisible();
    expect(screen.getByText("Student Time")).toBeVisible();
  });

  test("shows single time column without ScheduleViewTimezones permission", () => {
    renderWithWrapper(
      <ScheduleOverviewDataGrid
        rows={mockRows}
        {...defaultPaginationProps}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel="View Details"
        emptyMessage="No classes scheduled"
      />,
      { permissions: [] }
    );

    const timeHeaders = screen.getAllByText("Time");
    expect(timeHeaders.length).toBeGreaterThan(0);
    expect(timeHeaders[0]).toBeVisible();
    expect(screen.queryByText("Your Time")).toBeNull();
  });

  test("renders student and teacher names in rows", () => {
    renderWithWrapper(
      <ScheduleOverviewDataGrid
        rows={mockRows}
        {...defaultPaginationProps}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel="View Details"
        emptyMessage="No classes scheduled"
      />,
      { permissions: [] }
    );

    expect(screen.getAllByText("Ahmed Hassan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dr. Sarah").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fatima Ali").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mr. Omar").length).toBeGreaterThan(0);
  });

  test("renders empty message when no rows", () => {
    renderWithWrapper(
      <ScheduleOverviewDataGrid
        rows={[]}
        page={0}
        pageSize={10}
        totalCount={0}
        onPageChange={mock(() => {})}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel="View Details"
        emptyMessage="No classes scheduled"
      />,
      { permissions: [] }
    );

    expect(screen.getByText("No classes scheduled")).toBeVisible();
  });
});
