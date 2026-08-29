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
import { AdminDashboardDesktopView } from "@/frontend/desktop/views/dashboard/admin/home/adminDashboard.desktop";
import {
  adminHomeLabels,
  adminHomeLocale,
  buildAdminDashboardViewModel,
} from "@/test/ui/components/admin/adminHomeViewFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("AdminDashboardDesktopView", () => {
  test("renders the schedule overview section as a data grid", () => {
    renderWithWrapper(<AdminDashboardDesktopView {...buildAdminDashboardViewModel()} />, {
      locale: adminHomeLocale,
    });

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  test("owns the pager inside the grid footer (zero standalone PaginationControls siblings)", () => {
    renderWithWrapper(<AdminDashboardDesktopView {...buildAdminDashboardViewModel()} />, {
      locale: adminHomeLocale,
    });

    const gridRoot = document.querySelector(".MuiDataGrid-root");
    expect(gridRoot).not.toBeNull();

    const pagerLabel = screen.getByText(adminHomeLabels.paginationRange(1, 10, 40));
    expect(pagerLabel.closest(".MuiDataGrid-root")).not.toBeNull();
  });

  test("header search renders through SearchBarField with the translated placeholder", () => {
    renderWithWrapper(<AdminDashboardDesktopView {...buildAdminDashboardViewModel({ canDashboardSearch: true })} />, {
      locale: adminHomeLocale,
    });

    expect(screen.getByPlaceholderText(adminHomeLabels.searchPlaceholder)).toBeVisible();
  });

  test("selected metric renders as a dismissible filter chip that clears the metric filter", () => {
    const onMetricClick = mock(() => {});
    const metricLabel = adminHomeLabels.metrics.taken;
    const { container } = renderWithWrapper(
      <AdminDashboardDesktopView
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
