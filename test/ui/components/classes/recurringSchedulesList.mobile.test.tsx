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
import { RecurringSchedulesListMobileView } from "@/frontend/mobile/views/dashboard/classes/recurring/recurringSchedulesListView.mobile";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

function renderMobileView(overrides: Partial<RecurringSchedulesListViewModel> = {}) {
  const viewModel = buildRecurringSchedulesViewModel(overrides);
  return render(<RecurringSchedulesListMobileView {...viewModel} />, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <TestWrapper locale={recurringLocale}>{children}</TestWrapper>
    ),
  });
}

describe("RecurringSchedulesListMobileView", () => {
  test("shows the empty message inside the card list when rows are empty", () => {
    renderMobileView({ rows: [], totalCount: 0 });

    expect(screen.getByText(recurringLabels.shell.emptyMessage)).toBeInTheDocument();
  });

  test("typing in the search bar fires onSearchChange", () => {
    const onSearchChange = mock(() => {});
    renderMobileView({ onSearchChange, rows: [makeRecurringScheduleRow()], totalCount: 1 });

    const searchInput = screen.getByPlaceholderText(recurringLabels.filters.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: "سارة" } });

    expect(onSearchChange).toHaveBeenCalledWith("سارة");
  });

  test("renders list rows and maps server pagination options", async () => {
    const onPageChange = mock(() => {});
    const { container } = renderMobileView({
      rows: [makeRecurringScheduleRow()],
      totalCount: 80,
      currentPage: 0,
      pageSize: 20,
      onPageChange,
    });

    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
    expect(screen.getByText(content => content.includes("80"))).toBeInTheDocument();

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in card list pager");
    }
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });
});
