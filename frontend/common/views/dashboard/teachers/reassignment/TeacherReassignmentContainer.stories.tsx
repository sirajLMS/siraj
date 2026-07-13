import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentByIdQueryDocument, teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { TeacherReassignmentContainer } from "@/frontend/common/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";

const MOCK_STUDENT_RESULT = {
  __typename: "AssociatedStudent" as const,
  id: "stu-005",
  name: "Zaid Al-Mansour",
  status: StudentStatus.Regular,
  primaryTeacherId: "teacher-1",
  teacherName: "Sarah Johnson",
  hoursPerWeek: 4,
  classesRemaining: 12,
  classesTotal: 24,
  language: "en",
  gender: "MALE",
  version: 1,
  updatedAt: "2024-10-15T10:30:00Z",
};

const reassignmentMocks = [
  {
    request: {
      query: studentByIdQueryDocument,
      variables: { studentId: "stu-005" },
    },
    result: { data: { studentById: MOCK_STUDENT_RESULT } },
  },
  {
    request: {
      query: teachersQueryDocument,
      variables: { search: "", limit: 100 },
    },
    result: {
      data: {
        teachers: [
          { __typename: "TeacherSimple" as const, id: "teacher-1", name: "Sarah Johnson" },
          { __typename: "TeacherSimple" as const, id: "teacher-2", name: "Ahmed Hassan" },
          { __typename: "TeacherSimple" as const, id: "teacher-3", name: "Fatima Al-Rashid" },
        ],
      },
    },
  },
];

const meta: Meta<typeof TeacherReassignmentContainer> = {
  title: "Views/dashboard/teachers/reassignment/TeacherReassignmentContainer",
  component: TeacherReassignmentContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <MockedProvider mocks={reassignmentMocks}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeacherReassignmentContainer>;

export const Default: Story = {
  args: {},
};
