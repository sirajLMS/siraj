mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
}));

mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/search-schedule",
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/availability-search.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { SearchScheduleContainer } from "@/frontend/views/dashboard/search-schedule/SearchScheduleContainer";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

const mockSearchResult = {
  searchTeacherAvailability: {
    id: "availability-search-08:00-17:00",
    totalGaps: 3,
    teachers: [
      {
        id: "teacher-1",
        name: "Ahmed Hassan",
        gender: "MALE",
        timezone: "Africa/Cairo",
        gaps: [
          {
            id: "gap-1",
            teacherId: "teacher-1",
            teacherName: "Ahmed Hassan",
            teacherGender: "MALE",
            dayOfWeek: "MONDAY",
            gapStartTime: "09:00",
            gapEndTime: "11:00",
            timezone: "Africa/Cairo",
          },
          {
            id: "gap-2",
            teacherId: "teacher-1",
            teacherName: "Ahmed Hassan",
            teacherGender: "MALE",
            dayOfWeek: "WEDNESDAY",
            gapStartTime: "14:00",
            gapEndTime: "16:00",
            timezone: "Africa/Cairo",
          },
        ],
      },
    ],
  },
};

const mockEmptyResult = {
  searchTeacherAvailability: {
    id: "availability-search-08:00-17:00",
    totalGaps: 0,
    teachers: [],
  },
};

function createSearchMock(
  data = mockSearchResult,
  variables?: { input: { fromTime: string; toTime: string; gender: string | null } }
): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: searchTeacherAvailabilityQueryDocument,
        variables: variables ?? {
          input: { fromTime: "08:00", toTime: "17:00", gender: null },
        },
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

    expect(screen.queryByText("Schedule Availability Search")).toBeNull();
  });

  test("renders page title and search form when permission granted", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
    });

    expect(screen.getByText("Schedule Availability Search")).toBeVisible();
    expect(screen.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("does not show loading or results before form submission", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
    });

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/teachers with/)).toBeNull();
  });

  test("shows results after form submission with matching data", async () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks: createSearchMock(),
    });

    const searchButton = screen.getByRole("button", { name: /search/i });
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(searchButton);

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

    const searchButton = screen.getByRole("button", { name: /search/i });
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(searchButton);

    const noResults = await screen.findByText("No available time slots found for the selected criteria.");
    expect(noResults).toBeVisible();
  });

  test("shows error message when query fails", async () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: {
          query: searchTeacherAvailabilityQueryDocument,
          variables: { input: { fromTime: "08:00", toTime: "17:00", gender: null } },
        },
        error: new Error("Server error"),
      },
    ];

    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
      mocks,
    });

    const searchButton = screen.getByRole("button", { name: /search/i });
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(searchButton);

    const errorMsg = await screen.findByText("Failed to load availability data.");
    expect(errorMsg).toBeVisible();
  });

  test("form renders From and To time inputs", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
    });

    expect(screen.getByLabelText("From")).toBeVisible();
    expect(screen.getByLabelText("To")).toBeVisible();
  });

  test("form renders Gender dropdown with options", () => {
    renderWithWrapper(<SearchScheduleContainer />, {
      locale: "en",
      permissions: [AppPermission.ScheduleSearchAvailability],
    });

    expect(screen.getByLabelText("Gender")).toBeVisible();
  });
});
