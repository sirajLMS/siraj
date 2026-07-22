import {
  AppPermission,
  AvailabilitySearchSortBy,
  IanaTimezone,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/search-schedule",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/search-schedule",
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
  usePathname: () => "/search-schedule",
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { addDays, format } from "date-fns";

expect.extend(matchers);

import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSearchScheduleStore } from "@/frontend/common/stores/searchScheduleStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { SearchScheduleContainer } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleContainer";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const fromDate = format(new Date(), "yyyy-MM-dd");
const toDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

const defaultInput = {
  fromTime: "08:00",
  toTime: "17:00",
  fromDate,
  toDate,
  gender: null,
  minAvailableDays: null,
  minTotalGaps: null,
  teacherNameSearch: null,
  daysOfWeek: null,
  sortBy: AvailabilitySearchSortBy.MostAvailableDays,
  paginationArgs: {
    first: 10,
    page: 1,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  },
};

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  useSearchScheduleStore.setState({
    draft: useSearchScheduleStore.getState().draft,
    activeInput: null,
    hasSearched: false,
    page: 0,
    selectedTeacher: null,
  });
});

const mockSearchResult = {
  searchTeacherAvailability: {
    id: `availability-search-${fromDate}-${toDate}-08:00-17:00`,
    totalGaps: 3,
    totalCount: 1,
    pageInfo: {
      count: 1,
      currentPage: 1,
      hasMorePages: false,
      lastPage: 1,
      perPage: 10,
      total: 1,
    },
    teachers: [
      {
        id: "teacher-1",
        name: "Ahmed Hassan",
        gender: "MALE",
        timezone: IanaTimezone.AfricaCairo,
        availableDaysCount: 2,
        gaps: [
          {
            id: "gap-1",
            teacherId: "teacher-1",
            teacherName: "Ahmed Hassan",
            teacherGender: "MALE",
            dayOfWeek: "MONDAY",
            calendarDate: fromDate,
            gapStartTime: "09:00",
            gapEndTime: "11:00",
            timezone: IanaTimezone.AfricaCairo,
          },
        ],
      },
    ],
  },
};

const mockEmptyResult = {
  searchTeacherAvailability: {
    id: `availability-search-${fromDate}-${toDate}-08:00-17:00`,
    totalGaps: 0,
    totalCount: 0,
    pageInfo: {
      count: 0,
      currentPage: 1,
      hasMorePages: false,
      lastPage: 1,
      perPage: 10,
      total: 0,
    },
    teachers: [],
  },
};

function createSearchMock(
  data = mockSearchResult,
  variables?: { input: typeof defaultInput }
): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: searchTeacherAvailabilityQueryDocument,
        variables: variables ?? { input: defaultInput },
      },
      result: { data },
    },
  ];
}

describe("SearchScheduleContainer", () => {
  test("hides entire page when user lacks ScheduleSearchAvailability", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [],
    });

    expect(screen.queryByText("Search Schedule Availability")).toBeNull();
  });

  test("renders page title and search form when permission granted", async () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(),
    });

    expect(await screen.findByText("Search Schedule Availability")).toBeVisible();
    expect(screen.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("shows skeleton while initial query is loading", async () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(),
    });

    await waitFor(() => {
      expect(document.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
    });
  });

  test("shows results after initial load with matching data", async () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(),
    });

    const teacherName = await screen.findByText("Ahmed Hassan");
    expect(teacherName).toBeVisible();

    const gapTime = await screen.findByText("09:00 - 11:00");
    expect(gapTime).toBeVisible();
  });

  test("shows no results message when query returns empty", async () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(mockEmptyResult),
    });

    const noResults = await screen.findByText("No available time slots found for the given criteria.");
    expect(noResults).toBeVisible();
  });

  test("shows error message when query fails", async () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: {
          query: searchTeacherAvailabilityQueryDocument,
          variables: { input: defaultInput },
        },
        error: new Error("Server error"),
      },
    ];

    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks,
    });

    const errorMsg = await screen.findByText("Failed to load availability data.");
    expect(errorMsg).toBeVisible();
  });

  test("form renders filter inputs", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(),
    });

    expect(screen.getByLabelText("Date range")).toBeVisible();
    expect(screen.getByLabelText("Time range")).toBeVisible();
    expect(screen.getByLabelText("Teacher name")).toBeVisible();
    expect(screen.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("form renders filter drawer button", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(),
    });

    expect(screen.getByLabelText("Filters")).toBeVisible();
  });
});
