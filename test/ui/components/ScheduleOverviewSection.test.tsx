import { mock } from "bun:test";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}) }),
  useParams: () => ({ locale: "ar" }),
  usePathname: () => "/ar/dashboard",
}));

import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ScheduleOverviewSectionProps } from "@/frontend/views/dashboard/dashboard/components/ScheduleOverviewSection";
import { ScheduleOverviewSection } from "@/frontend/views/dashboard/dashboard/components/ScheduleOverviewSection";
import type { ClassStatus } from "@/frontend/views/dashboard/types/dashboard";
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

const createMockProps = (overrides: Partial<ScheduleOverviewSectionProps> = {}): ScheduleOverviewSectionProps => ({
  title: "Schedule Overview",
  searchPlaceholder: "Search by student name",
  searchValue: "",
  rows: [],
  headers: {
    classId: "Class ID",
    student: "Student",
    teacher: "Teacher",
    time: "Time",
    yourTime: "Your Time",
    teacherTime: "Teacher Time",
    studentTime: "Student Time",
    status: "Status",
    actions: "Actions",
  },
  statusLabels,
  detailsLabel: "View Details",
  emptyMessage: "No classes scheduled",
  showingText: "Showing 0 of 0",
  dateLabel: "Date",
  dateValue: "2026-06-20",
  teacherPlaceholder: "Filter by teacher",
  teacherValue: "",
  submitLabel: "Apply",
  teachers: [],
  page: 0,
  pageSize: 10,
  totalCount: 0,
  onPageChange: mock(() => {}),
  onSearchChange: mock(() => {}),
  onDateChange: mock(() => {}),
  onTeacherChange: mock(() => {}),
  onSubmit: mock(() => {}),
  ...overrides,
});

describe("ScheduleOverviewSection", () => {
  test("search input visible with DashboardSearch permission", () => {
    const props = createMockProps();
    renderWithWrapper(<ScheduleOverviewSection {...props} />, {
      permissions: [AppPermission.DashboardSearch],
    });

    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes.length).toBeGreaterThan(0);
    expect(textboxes[0]).toBeVisible();
  });

  test("search input hidden without DashboardSearch permission", () => {
    const props = createMockProps();
    renderWithWrapper(<ScheduleOverviewSection {...props} />, { permissions: [] });

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  test("search input has correct placeholder", () => {
    const props = createMockProps({ searchPlaceholder: "Search by student name" });
    renderWithWrapper(<ScheduleOverviewSection {...props} />, {
      permissions: [AppPermission.DashboardSearch],
    });

    const textbox = screen.getAllByRole("textbox")[0];
    expect(textbox).toHaveAttribute("placeholder", "Search by student name");
  });

  test("section title renders correctly", () => {
    const props = createMockProps({ title: "Schedule Overview" });
    renderWithWrapper(<ScheduleOverviewSection {...props} />, { permissions: [] });

    const titles = screen.getAllByText("Schedule Overview");
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeVisible();
  });

  test("empty message shown when no rows", () => {
    const props = createMockProps({ rows: [], emptyMessage: "No classes scheduled" });
    renderWithWrapper(<ScheduleOverviewSection {...props} />, { permissions: [] });

    const messages = screen.getAllByText("No classes scheduled");
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBeVisible();
  });
});
