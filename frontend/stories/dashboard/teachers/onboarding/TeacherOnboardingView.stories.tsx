import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { seedPermissions } from "@/frontend/common/stories";
import { TeacherOnboardingContainer } from "@/frontend/common/views/dashboard/teachers/onboarding/TeacherOnboardingContainer";

const meta = {
  title: "Views/dashboard/teachers/onboarding/TeacherOnboardingContainer",
  component: TeacherOnboardingContainer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TeacherOnboardingContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.TeachersCreate]);
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.TeachersCreate]);
      return <Story />;
    },
  ],
};
