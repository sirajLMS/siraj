mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}) }),
  useParams: () => ({ locale: "ar" }),
  usePathname: () => "/ar/dashboard",
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { ScheduleOverviewDataGrid } from "@/frontend/views/dashboard/dashboard/components/ScheduleOverviewDataGrid";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const statusLabels: Record<ClassStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  absent: "Absent",
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

const mockRows: readonly ScheduleRow[] = [
  {
    id: "row-1",
    classId: "#CLS-101",
    student: "Ahmed Hassan",
    teacher: "Dr. Sarah",
    yourTime: "10:00 AM",
    teacherTime: "11:00 AM",
    studentTime: "10:00 AM",
    time: "10:00 AM",
    status: "scheduled",
  },
  {
    id: "row-2",
    classId: "#CLS-102",
    student: "Fatima Ali",
    teacher: "Mr. Omar",
    yourTime: "2:00 PM",
    teacherTime: "3:00 PM",
    studentTime: "2:00 PM",
    time: "2:00 PM",
    status: "completed",
  },
];

describe("ScheduleOverviewDataGrid", () => {
  test("shows timezone columns with ScheduleViewTimezones permission", () => {
    renderWithWrapper(
      <ScheduleOverviewDataGrid
        rows={mockRows}
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
