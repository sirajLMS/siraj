import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { addDays, format } from "date-fns";
import { StoryBookPageContainer } from "@/frontend/common/components/ui/story/StoryBookPageContainer";
import { DayOfWeek, IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  searchTeacherAvailabilityQueryDocument,
  teachersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useSearchScheduleStore } from "@/frontend/common/stores/searchScheduleStore";
import { SearchScheduleContainer } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleContainer";

const fromDate = format(new Date(), "yyyy-MM-dd");
const toDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

const MOCK_RESULT = {
  __typename: "AvailabilitySearchResult" as const,
  id: `availability-search-${fromDate}-${toDate}-08:00-17:00`,
  totalGaps: 3,
  totalCount: 1,
  pageInfo: {
    __typename: "PageInfo" as const,
    count: 1,
    currentPage: 1,
    hasMorePages: false,
    lastPage: 1,
    perPage: 10,
    total: 1,
  },
  teachers: [
    {
      __typename: "AvailabilitySearchTeacher" as const,
      id: "teacher-1",
      name: "Ahmed Hassan",
      gender: "MALE",
      timezone: IanaTimezone.AfricaCairo,
      availableDaysCount: 2,
      gaps: [
        {
          __typename: "TeacherAvailabilityGap" as const,
          id: "gap-1",
          teacherId: "teacher-1",
          teacherName: "Ahmed Hassan",
          teacherGender: "MALE",
          dayOfWeek: DayOfWeek.Monday,
          calendarDate: fromDate,
          gapStartTime: "09:00",
          gapEndTime: "11:00",
          timezone: IanaTimezone.AfricaCairo,
        },
      ],
    },
  ],
};

const searchMocks = [
  {
    request: {
      query: teachersQueryDocument,
      variables: { search: "", limit: 20 },
    },
    result: { data: { teachers: [] } },
  },
  {
    request: {
      query: searchTeacherAvailabilityQueryDocument,
      variables: {
        input: {
          fromTime: "08:00",
          toTime: "17:00",
          fromDate,
          toDate,
          gender: null,
          minAvailableDays: null,
          minTotalGaps: null,
          teacherNameSearch: null,
          daysOfWeek: null,
          sortBy: "MOST_AVAILABLE_DAYS",
          paginationArgs: {
            first: 10,
            page: 1,
            skip: null,
            after: null,
            before: null,
            last: null,
            maxCount: null,
          },
        },
      },
    },
    result: { data: { searchTeacherAvailability: MOCK_RESULT } },
  },
];

const meta: Meta<typeof SearchScheduleContainer> = {
  title: "Views/dashboard/search-schedule/SearchScheduleContainer",
  component: SearchScheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      useSearchScheduleStore.setState({
        draft: useSearchScheduleStore.getState().draft,
        activeInput: null,
        hasSearched: false,
        page: 0,
        selectedTeacher: null,
        _hasHydrated: true,
        // NEW FOR PLAN v5: reset lifted UI state in the storybook decorator.
        formFilterDrawerOpen: false,
        sortMenuAnchorEl: null,
        monthDrawerOpen: false,
        monthDrawerAnchorFromDate: "",
        monthDrawerCurrentMonth: "",
        monthDrawerTeacher: null,
      });
      return (
        <StoryBookPageContainer>
          <MockedProvider mocks={searchMocks}>
            <Story />
          </MockedProvider>
        </StoryBookPageContainer>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SearchScheduleContainer>;

export const Default: Story = {
  args: {},
};
