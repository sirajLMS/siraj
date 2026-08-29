import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminDashboardMobileView } from "@/frontend/mobile/views/dashboard/admin/home/adminDashboard.mobile";
import { ScheduleOverviewMobileView } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/scheduleOverview.mobile";
import {
  adminHomeLabels,
  adminHomeLocale,
  buildAdminDashboardViewModel,
  buildScheduleOverviewViewModel,
} from "@/test/ui/components/admin/adminHomeViewFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const MOBILE_ADMIN_HOME_FILES = [
  "frontend/mobile/views/dashboard/admin/home/adminDashboard.mobile.tsx",
  "frontend/mobile/views/dashboard/admin/home/scheduleOverview/scheduleOverview.mobile.tsx",
] as const;

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("admin home mobile tier hygiene", () => {
  test("mobile files contain no responsive md breakpoint keys", () => {
    for (const file of MOBILE_ADMIN_HOME_FILES) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");

      expect(/[{,]\s*md\s*:/.test(source)).toBe(false);
      expect(source.includes("scheduleOverviewMobileChromeSx")).toBe(false);
      expect(source.includes("MobilePageContainer")).toBe(true);
      expect(source.includes("MobilePageHeader")).toBe(true);
    }
  });
});

describe("ScheduleOverviewMobileView", () => {
  test("renders the page header title and the card list empty state", () => {
    renderWithWrapper(
      <ScheduleOverviewMobileView
        {...buildScheduleOverviewViewModel({ rows: [], totalCount: 0, pageCount: 0 })}
      />,
      { locale: adminHomeLocale }
    );

    expect(screen.getByText(adminHomeLabels.scheduleOverview)).toBeInTheDocument();
    expect(screen.getByText(adminHomeLabels.noClasses)).toBeInTheDocument();
  });

  test("renders the toolbar search through SearchBarField with the translated placeholder", () => {
    renderWithWrapper(
      <ScheduleOverviewMobileView {...buildScheduleOverviewViewModel({ canDashboardSearch: true })} />,
      { locale: adminHomeLocale }
    );

    expect(screen.getByPlaceholderText(adminHomeLabels.searchPlaceholder)).toBeVisible();
  });

  test("renders schedule rows as mobile cards with details links", () => {
    renderWithWrapper(<ScheduleOverviewMobileView {...buildScheduleOverviewViewModel()} />, {
      locale: adminHomeLocale,
    });

    expect(screen.getAllByRole("link", { name: adminHomeLabels.details })).toHaveLength(1);
  });
});

describe("AdminDashboardMobileView", () => {
  test("renders the selected metric as a dismissible filter chip", () => {
    const onMetricClick = mock(() => {});
    const metricLabel = adminHomeLabels.metrics.taken;
    const { container } = renderWithWrapper(
      <AdminDashboardMobileView
        {...buildAdminDashboardViewModel({
          onMetricClick,
          selectedMetricKey: "taken",
          selectedMetricLabel: metricLabel,
        })}
      />,
      { locale: adminHomeLocale }
    );

    const deleteIcon = container.querySelector(".MuiChip-deleteIcon");
    if (!(deleteIcon instanceof Element)) {
      throw new Error("expected a dismiss affordance on the selected-metric chip");
    }

    fireEvent.click(deleteIcon);
    expect(onMetricClick).toHaveBeenCalledWith("taken");
  });
});
