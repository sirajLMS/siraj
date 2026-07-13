"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, CurrencyCode, Gender, IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  TeacherAdminData,
  TeacherOwnData,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherProfileView } from "@/frontend/views/dashboard/profile/teacher/TeacherProfileView";

const teacherOwnProfile: TeacherOwnData = {
  id: "teacher-own-1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: CurrencyCode.Usd,
  totalClasses: 128,
  displayAmount: null,
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
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: CurrencyCode.Usd,
  status: AccountStatus.Activated,
  updatedAt: "2024-06-01T00:00:00.000Z",
  totalClasses: 128,
  avgEngagementScore: 4.2,
  displayAmount: null,
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

const teacherWithLiveDisplayAmount: TeacherAdminData = {
  ...teacherAdminProfile,
  hourlyRate: "50",
  rateCurrency: CurrencyCode.Egp,
  displayAmount: {
    id: "displayAmount:teacher-admin-1:USD",
    amount: "1.62",
    currency: CurrencyCode.Usd,
    stale: false,
  },
};

export const AdminViewWithLiveDisplayAmount: Story = {
  decorators: [
    Story => {
      useUserStore.setState({ displayCurrency: CurrencyCode.Usd });
      return <Story />;
    },
  ],
  args: {
    teacherData: teacherWithLiveDisplayAmount,
    isAdminScope: true,
  },
};
