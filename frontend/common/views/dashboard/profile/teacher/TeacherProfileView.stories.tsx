"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeacherProfileContainer } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileContainer";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";

const meta: Meta<typeof TeacherProfileContainer> = {
  title: "Profile/Teacher/TeacherProfileView",
  component: TeacherProfileContainer,
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TeacherProfileContainer>;

export const OwnView: Story = {
  args: {
    scope: ProfileScope.OWN,
    mode: ProfileMode.VIEW,
    targetUserId: "teacher-own-1",
  },
};

export const AdminView: Story = {
  args: {
    scope: ProfileScope.OTHER,
    mode: ProfileMode.VIEW,
    targetUserId: "teacher-admin-1",
  },
};

export const EditOwnView: Story = {
  args: {
    scope: ProfileScope.OWN,
    mode: ProfileMode.EDIT,
    targetUserId: "teacher-own-1",
  },
};

export const EditAdminView: Story = {
  args: {
    scope: ProfileScope.OTHER,
    mode: ProfileMode.EDIT,
    targetUserId: "teacher-admin-1",
  },
};
