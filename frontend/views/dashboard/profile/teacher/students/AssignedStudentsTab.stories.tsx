"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import { AssignedStudentsTab } from "./AssignedStudentsTab";

const assignedStudents: NonNullable<
  NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>["assignedStudents"]
> = {
  id: "assigned-students-1",
  totalCount: 3,
  rows: [
    {
      id: "student-1",
      name: "Adam Noor",
      studentAvatarUrl: null,
      parentName: "Noor Abdullah",
      parentAvatarUrl: null,
      parentId: "par-1",
      parentUserId: "usr-par-1",
      className: "Conversation A",
      status: StudentStatus.Regular,
      hoursPerWeek: 3,
      classesRemaining: 14,
      classesTotal: 20,
    },
    {
      id: "student-2",
      name: "Layla Hasan",
      studentAvatarUrl: null,
      parentName: "Hasan Karim",
      parentAvatarUrl: null,
      parentId: "par-2",
      parentUserId: "usr-par-2",
      className: "Grammar B",
      status: StudentStatus.OnTrial,
      hoursPerWeek: 2,
      classesRemaining: 6,
      classesTotal: 10,
    },
    {
      id: "student-3",
      name: "Yousef Ali",
      studentAvatarUrl: null,
      parentName: "Ali Omar",
      parentAvatarUrl: null,
      parentId: "par-3",
      parentUserId: "usr-par-3",
      className: null,
      status: StudentStatus.Suspended,
      hoursPerWeek: 1,
      classesRemaining: 1,
      classesTotal: 8,
    },
  ],
};

const meta: Meta<typeof AssignedStudentsTab> = {
  title: "Views/profile/teacher/students",
  component: AssignedStudentsTab,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssignedStudentsTab>;

export const Default: Story = {
  args: {
    assignedStudents,
    loading: false,
    hasError: false,
    onRetry: () => {},
  },
};

export const Empty: Story = {
  args: {
    assignedStudents: { id: "assigned-students-empty", totalCount: 0, rows: [] },
    loading: false,
    hasError: false,
    onRetry: () => {},
  },
};

export const Loading: Story = {
  args: {
    assignedStudents: null,
    loading: true,
    hasError: false,
    onRetry: () => {},
  },
};

export const ErrorState: Story = {
  args: {
    assignedStudents: null,
    loading: false,
    hasError: true,
    onRetry: () => {},
  },
};
