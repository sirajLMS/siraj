import { mock } from "bun:test";

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "ar" }),
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

mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  AppPermission,
  ClassExecutionState,
  ClassOutcome,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { createDailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/scheduleFixture";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

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
  className: "Class",
  student: "Student",
  teacher: "Teacher",
  time: "Time",
  yourTime: "Your Time",
  teacherTime: "Teacher Time",
  studentTime: "Student Time",
  duration: "Duration",
  status: "Status",
  actions: "Actions",
  history: "History",
  joinVideo: "Join Video",
};

const mockRows: readonly DailyScheduleRow[] = [
  createDailyScheduleRow({
    id: "row-1",
    yourTime: "10:00 AM",
    teacherTime: "11:00 AM",
    studentTime: "10:00 AM",
    duration: 60,
    scheduledStartAt: "2028-01-01T10:00:00.000Z",
    scheduledEndAt: "2028-01-01T11:00:00.000Z",
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.NotActivated,
    student: { id: "student-1", name: "Ahmed Hassan", avatarUrl: null },
    teacher: { id: "teacher-1", name: "Dr. Sarah", avatarUrl: null },
  }),
  createDailyScheduleRow({
    id: "row-2",
    yourTime: "2:00 PM",
    teacherTime: "3:00 PM",
    studentTime: "2:00 PM",
    duration: 60,
    scheduledStartAt: "2028-01-01T10:00:00.000Z",
    scheduledEndAt: "2028-01-01T11:00:00.000Z",
    outcome: ClassOutcome.Taken,
    executionState: ClassExecutionState.Completed,
    student: { id: "student-2", name: "Fatima Ali", avatarUrl: null },
    teacher: { id: "teacher-2", name: "Mr. Omar", avatarUrl: null },
  }),
];

const defaultPaginationProps = {
  page: 0,
  pageSize: 10,
  totalCount: mockRows.length,
  onPageChange: mock(() => {}),
};

function renderScheduleDataGrid(permissions: AppPermission[] = []) {
  return renderWithWrapper(
    <ScheduleOverviewDataGrid
      rows={mockRows}
      {...defaultPaginationProps}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel="View Details"
      emptyMessage="No classes scheduled"
    />,
    { permissions }
  );
}

describe("ScheduleOverviewDataGrid", () => {
  test("shows timezone columns with ScheduleViewTimezones permission", () => {
    renderScheduleDataGrid([AppPermission.ScheduleViewTimezones]);

    expect(screen.getByText("Your Time")).toBeVisible();
    expect(screen.getByText("Teacher Time")).toBeVisible();
    expect(screen.getByText("Student Time")).toBeVisible();
  });

  test("shows single time column without ScheduleViewTimezones permission", () => {
    renderScheduleDataGrid([]);

    expect(screen.getByText("Your Time")).toBeVisible();
    expect(screen.queryByText("Time")).toBeNull();
  });

  test("renders student and teacher names as profile links", () => {
    renderScheduleDataGrid([]);

    expect(screen.getByRole("link", { name: "AH Ahmed Hassan" })).toHaveAttribute(
      "href",
      "/students/student-1/profile?tab=status"
    );
    expect(screen.getByRole("link", { name: "DS Dr. Sarah" })).toHaveAttribute("href", "/teachers/teacher-1/profile");
  });

  test("renders history and details action links", () => {
    renderScheduleDataGrid([]);

    expect(screen.getAllByRole("link", { name: "History" })[0]).toHaveAttribute(
      "href",
      "/students/student-1/profile?tab=history"
    );
    expect(screen.getAllByRole("link", { name: "View Details" })[0]).toHaveAttribute("href", "/classes/row-1");
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
