"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { TeacherAdminEditForm } from "./TeacherAdminEditForm";
import { TeacherProfileEditForm } from "./TeacherProfileEditForm";

const ownTeacherData = {
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  zoomLink: "https://zoom.us/j/teacher123",
};

const adminTeacherData = {
  ...ownTeacherData,
  nationalId: "****6789",
  dateOfBirth: "1990-05-15",
  gender: null,
  address: "123 King Fahd Rd, Riyadh",
  qualifications: "Bachelor of Islamic Studies",
  zoomUsername: "ahmed.teacher",
  timezone: "Asia/Riyadh",
  hourlyRate: "45.00",
  rateCurrency: "USD",
  paymentMethod: null,
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
      hasZoomPassword
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  ),
};
