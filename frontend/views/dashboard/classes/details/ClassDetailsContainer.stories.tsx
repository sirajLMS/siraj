import type { Meta, StoryObj } from "@storybook/react";
import { ClassDetailsContainer } from "./ClassDetailsContainer";

const meta: Meta<typeof ClassDetailsContainer> = {
  title: "Views/dashboard/classes/details/ClassDetailsContainer",
  component: ClassDetailsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ClassDetailsContainer>;

export const Default: Story = {
  args: {},
};
