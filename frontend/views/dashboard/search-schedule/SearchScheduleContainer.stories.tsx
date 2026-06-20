import type { Meta, StoryObj } from "@storybook/react";
import { StoryBookPageContainer } from "@/frontend/components/ui/StoryBookPageContainer";
import { SearchScheduleContainer } from "./SearchScheduleContainer";

const meta: Meta<typeof SearchScheduleContainer> = {
  title: "Views/dashboard/search-schedule/SearchScheduleContainer",
  component: SearchScheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <StoryBookPageContainer>
        <Story />
      </StoryBookPageContainer>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchScheduleContainer>;

export const Default: Story = {
  args: {},
};
