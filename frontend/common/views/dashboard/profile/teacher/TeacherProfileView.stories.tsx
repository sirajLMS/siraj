"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherProfileView } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileView";

const meta: Meta<typeof TeacherProfileView> = {
  title: "Profile/Teacher/TeacherProfileView",
  component: TeacherProfileView,
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TeacherProfileView>;

export const OwnView: Story = {
  args: {
    scope: ProfileScope.Own,
    mode: ProfileMode.View,
    targetUserId: "teacher-own-1",
  },
};

export const AdminView: Story = {
  args: {
    scope: ProfileScope.Other,
    mode: ProfileMode.View,
    targetUserId: "teacher-admin-1",
  },
};

export const EditOwnView: Story = {
  args: {
    scope: ProfileScope.Own,
    mode: ProfileMode.Edit,
    targetUserId: "teacher-own-1",
  },
};

export const EditAdminView: Story = {
  args: {
    scope: ProfileScope.Other,
    mode: ProfileMode.Edit,
    targetUserId: "teacher-admin-1",
  },
};
