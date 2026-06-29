import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { DayOfWeek } from "@/frontend/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/graphql/sharedDocuments/availability-search.documents";
import { TeacherAvailabilityContainer } from "./TeacherAvailabilityContainer";

const MOCK_RESULT = {
  __typename: "AvailabilitySearchResult" as const,
  id: "availability-search-08:00-17:00",
  totalGaps: 5,
  teachers: [
    {
      __typename: "AvailabilitySearchTeacher" as const,
      id: "teacher-1",
      name: "Sarah Johnson",
      gender: "FEMALE",
      timezone: "AST",
      gaps: [
        {
          __typename: "TeacherAvailabilityGap" as const,
          id: "gap-1",
          teacherId: "teacher-1",
          teacherName: "Sarah Johnson",
          teacherGender: "FEMALE",
          dayOfWeek: DayOfWeek.Monday,
          gapStartTime: "09:00",
          gapEndTime: "10:00",
          timezone: "AST",
        },
        {
          __typename: "TeacherAvailabilityGap" as const,
          id: "gap-2",
          teacherId: "teacher-1",
          teacherName: "Sarah Johnson",
          teacherGender: "FEMALE",
          dayOfWeek: DayOfWeek.Wednesday,
          gapStartTime: "11:00",
          gapEndTime: "12:00",
          timezone: "AST",
        },
      ],
    },
    {
      __typename: "AvailabilitySearchTeacher" as const,
      id: "teacher-2",
      name: "Ahmed Hassan",
      gender: "MALE",
      timezone: "EST",
      gaps: [
        {
          __typename: "TeacherAvailabilityGap" as const,
          id: "gap-3",
          teacherId: "teacher-2",
          teacherName: "Ahmed Hassan",
          teacherGender: "MALE",
          dayOfWeek: DayOfWeek.Tuesday,
          gapStartTime: "10:00",
          gapEndTime: "11:00",
          timezone: "EST",
        },
      ],
    },
  ],
};

const availabilitySearchMocks = [
  {
    request: {
      query: searchTeacherAvailabilityQueryDocument,
      variables: { input: { fromTime: "08:00", toTime: "17:00", gender: null } },
    },
    result: { data: { searchTeacherAvailability: MOCK_RESULT } },
  },
];

const meta: Meta<typeof TeacherAvailabilityContainer> = {
  title: "Views/dashboard/teachers/availability/TeacherAvailabilityContainer",
  component: TeacherAvailabilityContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <MockedProvider mocks={availabilitySearchMocks}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeacherAvailabilityContainer>;

export const Default: Story = {
  args: {
    teacherId: "teacher-1",
  },
};
