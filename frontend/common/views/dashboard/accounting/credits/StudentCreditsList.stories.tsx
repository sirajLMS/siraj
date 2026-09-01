import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import {
  DIRECTORY_FETCH_LIMIT,
  StudentCreditsList,
} from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList";

interface CreditsRowFixture {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly classesRemaining: number | null;
  readonly classesTotal: number;
  readonly teacherName: string | null;
}

function buildRow({
  id,
  name,
  email,
  classesRemaining,
  classesTotal,
  teacherName,
}: CreditsRowFixture): Record<string, unknown> {
  return {
    __typename: "StudentDirectoryRow",
    id,
    name,
    email,
    avatarUrl: null,
    status: "REGULAR",
    classesRemaining,
    classesTotal,
    hoursPerWeek: 2,
    teacherName,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

// Covers every balance-chip tone: healthy (success), low (warning), exhausted
// (error), un-tracked (default), plus an unassigned-teacher row.
const creditRows = [
  buildRow({
    id: "s-1",
    name: "Omar Halim",
    email: "omar.halim@example.com",
    classesRemaining: 14,
    classesTotal: 20,
    teacherName: "Layla Haddad",
  }),
  buildRow({
    id: "s-2",
    name: "Mariam Saeed",
    email: "mariam.saeed@example.com",
    classesRemaining: 9,
    classesTotal: 12,
    teacherName: "Karim Mansour",
  }),
  buildRow({
    id: "s-3",
    name: "Zaid Al-Amri",
    email: "zaid.alamri@example.com",
    classesRemaining: 2,
    classesTotal: 10,
    teacherName: "Huda Nasser",
  }),
  buildRow({
    id: "s-4",
    name: "Noor Abdelrahman",
    email: "noor.abdelrahman@example.com",
    classesRemaining: 1,
    classesTotal: 8,
    teacherName: "Layla Haddad",
  }),
  buildRow({
    id: "s-5",
    name: "Tarek El-Masry",
    email: "tarek.elmasry@example.com",
    classesRemaining: 0,
    classesTotal: 16,
    teacherName: "Karim Mansour",
  }),
  buildRow({
    id: "s-6",
    name: "Hala Osman",
    email: "hala.osman@example.com",
    classesRemaining: -2,
    classesTotal: 10,
    teacherName: "Omar Halim",
  }),
  buildRow({
    id: "s-7",
    name: "Sultan Al-Rashid",
    email: "sultan.alrashid@example.com",
    classesRemaining: null,
    classesTotal: 0,
    teacherName: null,
  }),
  buildRow({
    id: "s-8",
    name: "Dina Karam",
    email: "dina.karam@example.com",
    classesRemaining: 6,
    classesTotal: 24,
    teacherName: "Huda Nasser",
  }),
];

function directoryMock(rows: readonly Record<string, unknown>[]): MockLink.MockedResponse {
  return {
    request: { query: studentsDirectoryQueryDocument, variables: { search: null, limit: DIRECTORY_FETCH_LIMIT } },
    result: { data: { studentsDirectory: rows } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

const meta: Meta<typeof StudentCreditsList> = {
  title: "Views/dashboard/accounting/credits/StudentCreditsList",
  component: StudentCreditsList,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithStudents: Story = {
  decorators: [
    Story => (
      <Box sx={{ p: 3 }}>
        <MockedProvider mocks={[directoryMock(creditRows)]}>
          <Story />
        </MockedProvider>
      </Box>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    Story => (
      <Box sx={{ p: 3 }}>
        <MockedProvider mocks={[directoryMock([])]}>
          <Story />
        </MockedProvider>
      </Box>
    ),
  ],
};
