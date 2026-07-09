import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { addDays, format } from "date-fns";
import { StoryBookPageContainer } from "@/frontend/components/ui/story/StoryBookPageContainer";
import { DayOfWeek, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/availability-search.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import { useSearchScheduleStore } from "@/frontend/stores/searchScheduleStore";
import { SearchScheduleContainer } from "./SearchScheduleContainer";

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
      variables: { search: "", limit: 10 },
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
        teacherSearchInput: "",
        debouncedTeacherSearch: "",
        selectedTeacher: null,
        _hasHydrated: true,
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
