import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "ar", includeRouter: false, routingIncludeReplaceAndPrefetch: false });

await mock.module("next/link", () => ({
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

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { createDailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/scheduleFixture";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const locale: AppLocale = "ar";
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const headers = {
  className: adminLabels.className,
  student: adminLabels.student,
  teacher: adminLabels.teacher,
  time: adminLabels.time,
  yourTime: adminLabels.yourTime,
  teacherTime: adminLabels.teacherTime,
  studentTime: adminLabels.studentTime,
  duration: adminLabels.duration,
  status: adminLabels.status,
  actions: adminLabels.actions,
  history: adminLabels.history,
  joinVideo: adminLabels.joinVideo,
};

const statusLabels: Record<ClassOutcome | ClassExecutionState, string> = {
  [ClassOutcome.Pending]: adminLabels.statusLabels.PENDING,
  [ClassOutcome.Taken]: adminLabels.statusLabels.TAKEN,
  [ClassOutcome.Absent]: adminLabels.statusLabels.ABSENT,
  [ClassOutcome.Leave]: adminLabels.statusLabels.LEAVE,
  [ClassExecutionState.NotActivated]: adminLabels.statusLabels.NOT_ACTIVATED,
  [ClassExecutionState.Activated]: adminLabels.statusLabels.ACTIVATED,
  [ClassExecutionState.Running]: adminLabels.statusLabels.RUNNING,
  [ClassExecutionState.Completed]: adminLabels.statusLabels.COMPLETED,
  [ClassExecutionState.OnDemandConflictHeld]: adminLabels.statusLabels.ON_DEMAND_CONFLICT_HELD,
  [ClassExecutionState.OnDemandNoCreditsAbsent]: adminLabels.statusLabels.ON_DEMAND_NO_CREDITS_ABSENT,
  [ClassExecutionState.OnDemandNoCreditsCancelled]: adminLabels.statusLabels.ON_DEMAND_NO_CREDITS_CANCELLED,
  [ClassExecutionState.OnDemandPendingCredits]: adminLabels.statusLabels.ON_DEMAND_PENDING_CREDITS,
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
      detailsLabel={adminLabels.details}
      emptyMessage={adminLabels.noClasses}
    />,
    { permissions, locale }
  );
}

describe("ScheduleOverviewDataGrid", () => {
  test("shows timezone columns with ScheduleViewTimezones permission", () => {
    renderScheduleDataGrid([AppPermission.ScheduleViewTimezones]);

    expect(screen.getByText(adminLabels.yourTime)).toBeVisible();
    expect(screen.getByText(adminLabels.teacherTime)).toBeVisible();
    expect(screen.getByText(adminLabels.studentTime)).toBeVisible();
  });

  test("shows single time column without ScheduleViewTimezones permission", () => {
    renderScheduleDataGrid([]);

    expect(screen.getByText(adminLabels.yourTime)).toBeVisible();
    expect(screen.queryByText(adminLabels.time)).toBeNull();
  });

  test("showTimezones prop overrides the store-derived permission", () => {
    renderWithWrapper(
      <ScheduleOverviewDataGrid
        rows={mockRows}
        {...defaultPaginationProps}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel={adminLabels.details}
        emptyMessage={adminLabels.noClasses}
        showTimezones
      />,
      { permissions: [], locale }
    );

    expect(screen.getByText(adminLabels.teacherTime)).toBeVisible();
    expect(screen.getByText(adminLabels.studentTime)).toBeVisible();
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

    expect(screen.getAllByRole("link", { name: adminLabels.history })[0]).toHaveAttribute(
      "href",
      "/students/student-1/profile?tab=history"
    );
    expect(screen.getAllByRole("link", { name: adminLabels.details })[0]).toHaveAttribute("href", "/classes/row-1");
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
        detailsLabel={adminLabels.details}
        emptyMessage={adminLabels.noClasses}
      />,
      { permissions: [], locale }
    );

    expect(screen.getByText(adminLabels.noClasses)).toBeVisible();
  });
});
