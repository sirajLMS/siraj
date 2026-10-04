import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildQuotaAudienceLabels } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.fixtures";
import { withQuotaAudienceMocks } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.helpers";
import { StudentQuotaAudienceView } from "@/frontend/common/views/dashboard/students/quota/audience/StudentQuotaView";
import {
  defaultMocks,
  emptyMocks,
  errorMocks,
  exhaustedMocks,
  setStudentUser,
} from "@/frontend/common/views/dashboard/students/quota/audience/StudentQuotaView.stories.fixtures";

const mockLabels = buildQuotaAudienceLabels("My Quota");

const meta = {
  title: "Views/dashboard/students/quota/audience/StudentQuotaView",
  component: StudentQuotaAudienceView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withQuotaAudienceMocks(defaultMocks, setStudentUser)],
} satisfies Meta<typeof StudentQuotaAudienceView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Loading: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks([], setStudentUser)],
};

export const Empty: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(emptyMocks, setStudentUser)],
};

export const ErrorState: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(errorMocks, setStudentUser)],
};

export const Exhausted: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(exhaustedMocks, setStudentUser)],
};
