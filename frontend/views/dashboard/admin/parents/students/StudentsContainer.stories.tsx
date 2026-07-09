import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-directory.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { StudentsContainer } from "@/frontend/views/dashboard/admin/parents/students/StudentsContainer";

const MOCK_STUDENT_ROWS = [
  {
    __typename: "StudentDirectoryRow" as const,
    id: "student-1",
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    status: "REGULAR",
    classesRemaining: 12,
    classesTotal: 24,
    hoursPerWeek: "3.50",
    teacherName: "Sarah Johnson",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    __typename: "StudentDirectoryRow" as const,
    id: "student-2",
    name: "Omar Ali",
    email: "omar@example.com",
    status: "SUSPENDED",
    classesRemaining: 8,
    classesTotal: 20,
    hoursPerWeek: "2.00",
    teacherName: "Michael Brown",
    createdAt: "2025-02-20T14:30:00Z",
  },
  {
    __typename: "StudentDirectoryRow" as const,
    id: "student-3",
    name: "Layla Ibrahim",
    email: "layla@example.com",
    status: "ON_LEAVE",
    classesRemaining: 15,
    classesTotal: 30,
    hoursPerWeek: "4.00",
    teacherName: null,
    createdAt: "2025-03-01T08:00:00Z",
  },
];

const defaultVariables = {
  filterArgs: null,
  orderBy: null,
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

const studentDirectoryMocks = [
  {
    request: {
      query: studentDirectoryQueryDocument,
      variables: defaultVariables,
    },
    result: {
      data: {
        studentDirectory: MOCK_STUDENT_ROWS,
      },
    },
  },
];

const meta: Meta<typeof StudentsContainer> = {
  title: "Views/dashboard/students/home/StudentsContainer",
  component: StudentsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const perms = [
        AppPermission.StudentsList,
        AppPermission.StaffViewDirectory,
        AppPermission.ResourcesList,
        AppPermission.ResourcesUpload,
        AppPermission.StaffEditProfile,
      ];
      useUserStore.setState({ permissions: perms });
      return (
        <MockedProvider mocks={studentDirectoryMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof StudentsContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: studentDirectoryQueryDocument,
              variables: defaultVariables,
            },
            result: {
              data: {
                studentDirectory: [],
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
