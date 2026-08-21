"use client";

import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { TeacherAdminEditForm } from "@/frontend/common/views/dashboard/profile/teacher/TeacherAdminEditForm";
import { TeacherProfileEditForm } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditForm";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  timezone: IanaTimezone.Asia_Riyadh,
  hourlyRate: "45.00",
  rateCurrency: CurrencyCode.Usd,
  status: null,
};

function useTeacherProfileStoryLabels() {
  const base = useAppTranslation(Translation.Profile.Base);
  const teacher = useAppTranslation(Translation.Profile.Teacher);
  const dashboard = useAppTranslation(Translation.Dashboard.TeacherProfile);
  const errors = useAppTranslation(Translation.Errors);
  return { base, teacher, dashboard, errors };
}

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

function OwnEditStory() {
  const labels = useTeacherProfileStoryLabels();
  return (
    <TeacherProfileEditForm
      labels={labels}
      teacherData={ownTeacherData}
      targetUserId="user-teacher-1"
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  );
}

function AdminEditStory() {
  const labels = useTeacherProfileStoryLabels();
  return (
    <TeacherAdminEditForm
      labels={labels}
      teacherData={adminTeacherData}
      targetUserId="user-teacher-1"
      isSaving={false}
      onSubmit={async () => {
        await Promise.resolve();
      }}
    />
  );
}

export const OwnEdit: Story = {
  render: () => <OwnEditStory />,
};

export const AdminEdit: Story = {
  render: () => <AdminEditStory />,
};
