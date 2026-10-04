import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeacherQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView";
import { mockLabels } from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView.stories.fixtures";
import {
  defaultMocks,
  emptyMocks,
  setTeacherUser,
} from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView.stories.mocks";

const meta = {
  title: "Views/dashboard/students/quota/audience/TeacherQuotaView",
  component: TeacherQuotaView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => {
      setTeacherUser();
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof TeacherQuotaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Empty: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setTeacherUser();
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
