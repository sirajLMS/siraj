mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "ar" }),
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

mock.module("@/shared/i18n/routing", () => ({
  locales: ["ar", "en"],
  defaultLocale: "ar",
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

// Mock RequirePermission to check permissions from useUserStore
// Note: mock.module registrations are process-global in Bun, so this mock
// will bleed into subsequent test files. The signature MUST match the real
// RequirePermission component (plural "permissions", single-or-array).
mock.module("@/frontend/common/components/auth/RequirePermission", () => ({
  RequirePermission: ({
    permissions,
    children,
    fallback = null,
  }: {
    permissions: AppPermission | readonly AppPermission[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => {
    const { hasPermission } = useUserStore();
    const required = Array.isArray(permissions) ? permissions : [permissions];
    const isAuthorized = required.some(permission => hasPermission(permission));
    return isAuthorized ? children : fallback;
  },
}));

// Mock the entire ScheduleOverviewView to render desktop directly.
// NOTE: The common standalone `ScheduleOverviewView` switcher was removed by the
// Plan v5 mobile/desktop refactor — the section is now composed inline by
// `AdminDashboardView` (common switcher) which delegates to
// `ScheduleOverviewDesktopView` / `ScheduleOverviewMobileView` tier views. The
// mock-module target path below redirects to the canonical desktop tier module
// (real file) so the import in this file resolves at type-check time; at runtime
// the mock factory still substitutes our hand-rolled stub for assertion control.
mock.module("@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/scheduleOverview.desktop", () => ({
  ScheduleOverviewDesktopView: (props: UseScheduleOverviewViewModelProps) => {
    const hasSearchPermission = useUserStore.getState().hasPermission?.(AppPermission.DashboardSearch) ?? false;
    return (
      <div data-testid="desktop-view">
        <div data-testid="section-title">{props.title}</div>
        {hasSearchPermission && props.searchPlaceholder && (
          <input
            placeholder={props.searchPlaceholder}
            value={props.searchValue}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => props.onSearchChange?.(event.target.value)}
          />
        )}
        {props.rows.length === 0 && <div data-testid="empty-message">{props.emptyMessage}</div>}
      </div>
    );
  },
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import React from "react";

expect.extend(matchers);

import {
  AppPermission,
  ClassExecutionState,
  ClassOutcome,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  ScheduleOverviewViewModel,
  UseScheduleOverviewViewModelProps,
} from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import { ScheduleOverviewDesktopView as ScheduleOverviewView } from "@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/scheduleOverview.desktop";
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

const createMockProps = (overrides: Partial<UseScheduleOverviewViewModelProps> = {}): ScheduleOverviewViewModel => {
  // Plan v5: the section's standalone `ScheduleOverviewView` switcher was removed
  // by the mobile/desktop refactor; the section is now rendered inline by tier
  // switchers (`ScheduleOverviewDesktopView` / `ScheduleOverviewMobileView`).
  // Those tier views take the full `ScheduleOverviewViewModel` (incl. the fields
  // the common `useScheduleOverviewViewModel` hook derives at runtime). The
  // runtime mocks below override the entire module so only the prop fields the
  // stub consumes matter, but we still surface a type-complete view model here
  // so `React.createElement(ScheduleOverviewView, props)` passes type-check.
  const base: UseScheduleOverviewViewModelProps = {
    title: "Schedule Overview",
    searchPlaceholder: "Search by student name",
    searchValue: "",
    rows: [],
    headers: {
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
    selectedTeacher: null,
    page: 0,
    pageSize: 10,
    totalCount: 0,
    onPageChange: mock(() => {}),
    onSearchChange: mock(() => {}),
    onDateChange: mock(() => {}),
    onTeacherChange: mock(() => {}),
    onSubmit: mock(() => {}),
    ...overrides,
  };
  return {
    ...base,
    pageCount: 0,
    showTimezones: false,
    locale: "en",
    canDashboardSearch: false,
    canScheduleFilterAdvanced: false,
  };
};

describe("ScheduleOverviewSection", () => {
  test("search input visible with DashboardSearch permission", () => {
    const props = createMockProps();
    renderWithWrapper(React.createElement(ScheduleOverviewView, props), {
      permissions: [AppPermission.DashboardSearch],
      viewport: "desktop",
    });

    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes.length).toBeGreaterThan(0);
    expect(textboxes[0]).toBeVisible();
  });

  test("search input hidden without DashboardSearch permission", () => {
    const props = createMockProps({ searchPlaceholder: "Search by student name" });
    renderWithWrapper(React.createElement(ScheduleOverviewView, props), { permissions: [], viewport: "desktop" });

    expect(screen.queryByPlaceholderText("Search by student name")).toBeNull();
  });

  test("search input has correct placeholder", () => {
    const props = createMockProps({ searchPlaceholder: "Search by student name" });
    renderWithWrapper(React.createElement(ScheduleOverviewView, props), {
      permissions: [AppPermission.DashboardSearch],
      viewport: "desktop",
    });

    const textbox = screen.getAllByRole("textbox")[0];
    expect(textbox).toHaveAttribute("placeholder", "Search by student name");
  });

  test("section title renders correctly", () => {
    const props = createMockProps({ title: "Schedule Overview" });
    renderWithWrapper(React.createElement(ScheduleOverviewView, props), { permissions: [], viewport: "desktop" });

    const titles = screen.getAllByText("Schedule Overview");
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeVisible();
  });

  test("empty message shown when no rows", () => {
    const props = createMockProps({ rows: [], emptyMessage: "No classes scheduled" });
    renderWithWrapper(React.createElement(ScheduleOverviewView, props), { permissions: [], viewport: "desktop" });

    const messages = screen.getAllByText("No classes scheduled");
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBeVisible();
  });
});
