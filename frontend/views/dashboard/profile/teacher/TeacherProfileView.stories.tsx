"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, Gender, IanaTimezone, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherAdminData, TeacherOwnData } from "./sections/teacherProfileTypes";
import { TeacherProfileView } from "./TeacherProfileView";

const teacherOwnProfile: TeacherOwnData = {
  id: "teacher-own-1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: "USD",
  paymentMethod: PaymentMethod.Paypal,
  zoomLink: "https://zoom.us/j/teacher123",
  totalClasses: 128,
};

const teacherAdminProfile: TeacherAdminData = {
  id: "teacher-admin-1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  nationalId: "****6789",
  dateOfBirth: "1990-05-15T00:00:00.000Z",
  gender: Gender.Male,
  address: "123 King Fahd Rd, Riyadh",
  qualifications: "Bachelor of Islamic Studies",
  zoomLink: "https://zoom.us/j/teacher123",
  zoomUsername: "ahmed.teacher",
  hasZoomPassword: true,
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: "USD",
  status: AccountStatus.Activated,
  updatedAt: "2024-06-01T00:00:00.000Z",
  paymentMethod: PaymentMethod.Paypal,
  totalClasses: 128,
  avgEngagementScore: 4.2,
};

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
    teacherData: teacherOwnProfile,
    isAdminScope: false,
  },
};

export const AdminView: Story = {
  args: {
    teacherData: teacherAdminProfile,
    isAdminScope: true,
  },
};
