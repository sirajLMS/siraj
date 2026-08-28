import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const locale: AppLocale = "ar";
const mockPush = mock((_url: string, _options?: unknown) => {});
const sharedSearchParams = new URLSearchParams();

await mockNextNavigation("/recurring-schedules", { locale, mockPush, searchParams: sharedSearchParams });

import type { MockLink } from "@apollo/client/testing";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { recurringSchedulesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useRecurringSchedulesListStore } from "@/frontend/common/stores/recurringSchedulesListStore";
import type { RecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import { useRecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringSchedulesListViewModel";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const PAGE_SIZE = 20;
const DEFAULT_PAGE = 1;

interface CapturedState {
  readonly page: number;
  readonly search: string;
  readonly total: number;
}

function buildListMock(page: number, search: string | null, totalCount: number): MockLink.MockedResponse {
  return {
    request: {
      query: recurringSchedulesQueryDocument,
      variables: {
        pagination: { page, first: PAGE_SIZE, after: null, before: null, last: null, maxCount: null, skip: null },
        search,
      },
    },
    result: {
      data: {
        recurringSchedules: {
          id: `schedules-page-${page}-${search ?? "all"}`,
          rows: [],
          totalCount,
          pageInfo: {
            count: 0,
            currentPage: page,
            firstItem: null,
            hasMorePages: false,
            lastItem: null,
            lastPage: page,
            perPage: PAGE_SIZE,
            total: totalCount,
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

let latestViewModel: RecurringSchedulesListViewModel | null = null;

function ViewModelConsumer() {
  const viewModel = useRecurringSchedulesListViewModel();
  useEffect(() => {
    latestViewModel = viewModel;
  }, [viewModel]);
  return (
    <>
      <output data-testid="vm-page">{viewModel.currentPage}</output>
      <output data-testid="vm-search">{viewModel.searchValue}</output>
      <output data-testid="vm-total">{viewModel.totalCount}</output>
    </>
  );
}

function readCapturedState(): CapturedState {
  return {
    page: Number(screen.getByTestId("vm-page").textContent),
    search: screen.getByTestId("vm-search").textContent ?? "",
    total: Number(screen.getByTestId("vm-total").textContent),
  };
}

function requireLatestViewModel(): RecurringSchedulesListViewModel {
  const viewModel = latestViewModel;
  if (!viewModel) {
    throw new Error("view model was not captured from the consumer component");
  }
  return viewModel;
}

function resetStore(): void {
  useRecurringSchedulesListStore.setState({ initialized: false, currentPage: DEFAULT_PAGE, searchValue: "" });
}

function clearSharedSearchParams(): void {
  const keys = Array.from(sharedSearchParams.keys());
  for (const key of keys) {
    sharedSearchParams.delete(key);
  }
}

beforeEach(() => {
  resetStore();
  clearSharedSearchParams();
  latestViewModel = null;
  mockPush.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("useRecurringSchedulesListStore", () => {
  test("starts uninitialized with the first page and an empty search", () => {
    const state = useRecurringSchedulesListStore.getState();
    expect(state.initialized).toBe(false);
    expect(state.currentPage).toBe(DEFAULT_PAGE);
    expect(state.searchValue).toBe("");
  });

  test("applySearch sets the search value and resets pagination to the first page", () => {
    const store = useRecurringSchedulesListStore.getState();
    store.setPage(4);
    store.applySearch("math");

    const state = useRecurringSchedulesListStore.getState();
    expect(state.searchValue).toBe("math");
    expect(state.currentPage).toBe(DEFAULT_PAGE);
    expect(state.initialized).toBe(true);
  });

  test("initialize seeds state once and ignores later calls", () => {
    const store = useRecurringSchedulesListStore.getState();
    store.initialize("physics", 3);
    store.initialize("chemistry", 9);

    const state = useRecurringSchedulesListStore.getState();
    expect(state.searchValue).toBe("physics");
    expect(state.currentPage).toBe(3);
    expect(state.initialized).toBe(true);
  });

  test("setPage marks the store initialized and updates the page", () => {
    useRecurringSchedulesListStore.getState().setPage(7);

    const state = useRecurringSchedulesListStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.currentPage).toBe(7);
  });
});

describe("useRecurringSchedulesListViewModel", () => {
  test("seeds the search from the URL on first mount (deep link)", async () => {
    sharedSearchParams.set("search", "physics");
    const mocks = [buildListMock(DEFAULT_PAGE, "physics", 42)];

    renderWithWrapper(<ViewModelConsumer />, { locale, mocks });

    expect(readCapturedState()).toEqual({ page: DEFAULT_PAGE, search: "physics", total: 0 });

    await waitFor(() => {
      expect(readCapturedState().total).toBe(42);
    });
  });

  test("keeps search and page in the store across unmount/remount (tier switch)", async () => {
    const mocks = [
      buildListMock(DEFAULT_PAGE, null, 10),
      buildListMock(DEFAULT_PAGE, "math", 7),
      buildListMock(3, "math", 99),
    ];

    const firstRender = renderWithWrapper(<ViewModelConsumer />, { locale, mocks });

    await waitFor(() => {
      expect(readCapturedState().total).toBe(10);
    });

    act(() => {
      requireLatestViewModel().onSearchChange("math");
    });

    await waitFor(() => {
      expect(readCapturedState()).toEqual({ page: DEFAULT_PAGE, search: "math", total: 7 });
    });
    expect(mockPush).toHaveBeenCalledWith("?search=math&page=1", { scroll: false });

    act(() => {
      requireLatestViewModel().onPageChange(3);
    });

    await waitFor(() => {
      expect(readCapturedState()).toEqual({ page: 3, search: "math", total: 99 });
    });
    expect(mockPush).toHaveBeenLastCalledWith("?page=3", { scroll: false });

    // Simulate a viewport tier switch: unmount the consumer and mount a fresh one.
    // The store must supply the previous page/search on the very first render.
    firstRender.unmount();
    latestViewModel = null;

    renderWithWrapper(<ViewModelConsumer />, { locale, mocks });

    expect(readCapturedState()).toEqual({ page: 3, search: "math", total: 0 });

    await waitFor(() => {
      expect(readCapturedState()).toEqual({ page: 3, search: "math", total: 99 });
    });
  });
});
