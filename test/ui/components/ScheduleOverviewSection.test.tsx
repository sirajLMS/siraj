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

import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ScheduleOverviewSectionProps } from "@/frontend/views/dashboard/admin/home/components/ScheduleOverviewSection";
import { ScheduleOverviewSection } from "@/frontend/views/dashboard/admin/home/components/ScheduleOverviewSection";
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

const createMockProps = (overrides: Partial<ScheduleOverviewSectionProps> = {}): ScheduleOverviewSectionProps => ({
  title: "Schedule Overview",
  searchPlaceholder: "Search by student name",
  searchValue: "",
  rows: [],
  headers: {
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
  },
  statusLabels,
  detailsLabel: "View Details",
  emptyMessage: "No classes scheduled",
  todayLabel: "Today",
  previousDayLabel: "Previous day",
  nextDayLabel: "Next day",
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
    const props = createMockProps({ searchPlaceholder: "Search by student name" });
    renderWithWrapper(<ScheduleOverviewSection {...props} />, { permissions: [] });

    expect(screen.queryByPlaceholderText("Search by student name")).toBeNull();
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
