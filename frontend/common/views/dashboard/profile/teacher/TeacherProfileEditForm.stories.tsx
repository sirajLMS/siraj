"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CurrencyCode, IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherAdminEditForm } from "@/frontend/common/views/dashboard/profile/teacher/TeacherAdminEditForm";
import { TeacherProfileEditForm } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditForm";

const ownTeacherData = {
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
};

const adminTeacherData = {
  ...ownTeacherData,
  nationalId: "****6789",
  dateOfBirth: "1990-05-15",
  gender: null,
  address: "123 King Fahd Rd, Riyadh",
  qualifications: "Bachelor of Islamic Studies",
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: CurrencyCode.Usd,
  status: null,
};

const meta: Meta<typeof TeacherProfileEditForm> = {
  title: "Profile/Teacher/TeacherProfileEditForms",
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 960, mx: "auto", p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TeacherProfileEditForm>;

export const OwnEdit: Story = {
  render: () => (
    <TeacherProfileEditForm
      teacherData={ownTeacherData}
      targetUserId="user-teacher-1"
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  ),
};

export const AdminEdit: Story = {
  render: () => (
    <TeacherAdminEditForm
      teacherData={adminTeacherData}
      targetUserId="user-teacher-1"
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  ),
};
