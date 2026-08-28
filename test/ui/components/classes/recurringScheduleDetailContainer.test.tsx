import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";

let viewModelCalls = 0;
const viewRenderProps: unknown[] = [];

const mockViewModel = {
  labelsBySection: {
    shell: { pageTitle: "Schedule", subtitle: "", breadcrumbs: [], invalidId: "", loadError: "", retryLabel: "" },
    form: {
      rate: {
        title: "",
        hourlyRateLabel: "",
        currencyLabel: "",
        saveLabel: "",
        clearLabel: "",
        successMessage: "",
        errorMessage: "",
      },
    },
  },
  loading: false,
  error: null,
  recurringScheduleId: "schedule-1",
  hourlyRate: null,
  rateCurrency: null,
  rateSaving: false,
  rateError: null,
  rateSuccess: false,
  onUpdateRate: async () => {},
  onRetry: () => {},
};

// The container must only call the ViewModel and delegate tier selection to the
// View (the switcher) — the duplicate lazy switcher logic was removed.
await mock.module("@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel", () => ({
  useRecurringScheduleDetailViewModel: () => {
    viewModelCalls += 1;
    return mockViewModel;
  },
}));

await mock.module("@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailView", () => ({
  RecurringScheduleDetailView: (props: unknown) => {
    viewRenderProps.push(props);
    return createElement("output", { "data-testid": "recurring-schedule-detail-view" });
  },
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { RecurringScheduleDetailContainer } from "@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailContainer";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

describe("RecurringScheduleDetailContainer", () => {
  afterEach(() => {
    cleanup();
    viewModelCalls = 0;
    viewRenderProps.length = 0;
  });

  test("renders the detail view switcher exactly once (single container -> switcher chain)", () => {
    renderWithWrapper(<RecurringScheduleDetailContainer />, { locale: "en" });

    expect(screen.getByTestId("recurring-schedule-detail-view")).toBeVisible();
    expect(viewModelCalls).toBeGreaterThanOrEqual(1);
    expect(viewRenderProps).toHaveLength(1);
  });

  test("forwards the full ViewModel result to the view switcher", () => {
    renderWithWrapper(<RecurringScheduleDetailContainer />, { locale: "en" });

    expect(screen.getByTestId("recurring-schedule-detail-view")).toBeVisible();
    expect(viewRenderProps[0]).toMatchObject({
      recurringScheduleId: mockViewModel.recurringScheduleId,
      loading: mockViewModel.loading,
    });
  });
});
