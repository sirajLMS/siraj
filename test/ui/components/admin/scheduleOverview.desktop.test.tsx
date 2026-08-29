import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "ar" });

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

import { useUserStore } from "@/frontend/common/stores/userStore";
import { ScheduleOverviewDesktopView } from "@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/scheduleOverview.desktop";
import {
  adminHomeLabels,
  adminHomeLocale,
  buildScheduleOverviewViewModel,
} from "@/test/ui/components/admin/adminHomeViewFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("ScheduleOverviewDesktopView", () => {
  test("renders the schedule overview as a data grid", () => {
    renderWithWrapper(<ScheduleOverviewDesktopView {...buildScheduleOverviewViewModel()} />, {
      locale: adminHomeLocale,
    });

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  test("owns the pagination inside the grid footer (no standalone sibling)", () => {
    renderWithWrapper(<ScheduleOverviewDesktopView {...buildScheduleOverviewViewModel()} />, {
      locale: adminHomeLocale,
    });

    const gridRoot = document.querySelector(".MuiDataGrid-root");
    expect(gridRoot).not.toBeNull();

    const pagerLabel = screen.getByText(adminHomeLabels.paginationRange(1, 10, 40));
    expect(pagerLabel.closest(".MuiDataGrid-root")).not.toBeNull();
    expect(gridRoot?.contains(pagerLabel)).toBe(true);
  });

  test("renders the section search via SearchBarField with the translated placeholder", () => {
    renderWithWrapper(
      <ScheduleOverviewDesktopView {...buildScheduleOverviewViewModel({ canDashboardSearch: true })} />,
      { locale: adminHomeLocale }
    );

    expect(screen.getByPlaceholderText(adminHomeLabels.searchPlaceholder)).toBeVisible();
  });

  test("renders the selected metric as a consistent filter chip in the title row", () => {
    const metricLabel = adminHomeLabels.metrics.taken;
    renderWithWrapper(
      <ScheduleOverviewDesktopView {...buildScheduleOverviewViewModel({ selectedMetricLabel: metricLabel })} />,
      { locale: adminHomeLocale }
    );

    const chipText = screen.getByText(metricLabel);
    expect(chipText.closest(".MuiChip-root")).not.toBeNull();
  });

  test("renders the empty message inside the grid when there are no rows", () => {
    renderWithWrapper(
      <ScheduleOverviewDesktopView {...buildScheduleOverviewViewModel({ rows: [], totalCount: 0, pageCount: 0 })} />,
      { locale: adminHomeLocale }
    );

    expect(screen.getByText(adminHomeLabels.noClasses)).toBeInTheDocument();
  });
});
