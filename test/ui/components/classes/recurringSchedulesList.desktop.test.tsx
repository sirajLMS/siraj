import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  adminLabels,
  buildRecurringSchedulesViewModel,
  makeRecurringScheduleRow,
  recurringLabels,
  recurringLocale,
} from "@/test/ui/components/classes/recurringSchedulesListFixtures";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/recurring-schedules", { locale: recurringLocale });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { RecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import { RecurringSchedulesListDesktopView } from "@/frontend/desktop/views/dashboard/classes/recurring/recurringSchedulesListView.desktop";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

function renderDesktopView(overrides: Partial<RecurringSchedulesListViewModel> = {}) {
  const viewModel = buildRecurringSchedulesViewModel(overrides);
  return render(<RecurringSchedulesListDesktopView {...viewModel} />, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <TestWrapper locale={recurringLocale}>{children}</TestWrapper>
    ),
  });
}

describe("RecurringSchedulesListDesktopView", () => {
  test("keeps the data grid mounted and shows the empty overlay when rows are empty", async () => {
    const { container } = renderDesktopView({ rows: [], totalCount: 0 });

    await waitFor(() => {
      expect(screen.getByText(recurringLabels.shell.emptyMessage)).toBeInTheDocument();
    });
    expect(container.querySelector(".MuiDataGrid-root")).not.toBeNull();
  });

  test("maps server pagination options into the grid pager", async () => {
    const onPageChange = mock(() => {});
    const { container } = renderDesktopView({
      rows: [makeRecurringScheduleRow()],
      totalCount: 80,
      currentPage: 0,
      pageSize: 20,
      onPageChange,
    });

    await waitFor(
      () => {
        expect(container.querySelector(".MuiDataGrid-footerContainer")).not.toBeNull();
        expect(screen.getByText(content => content.includes("80"))).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in grid pager");
    }
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  test("renders column headers and row values", () => {
    renderDesktopView({ rows: [makeRecurringScheduleRow()], totalCount: 1 });

    expect(screen.getByText(recurringLabels.columns.student)).toBeInTheDocument();
    expect(screen.getByText(recurringLabels.columns.duration)).toBeInTheDocument();
    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
  });

  test("typing in the search bar fires onSearchChange", () => {
    const onSearchChange = mock(() => {});
    renderDesktopView({ onSearchChange, rows: [makeRecurringScheduleRow()], totalCount: 1 });

    const searchInput = screen.getByPlaceholderText(recurringLabels.filters.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: "أحمد" } });

    expect(onSearchChange).toHaveBeenCalledWith("أحمد");
  });
});
