import type { Meta, StoryObj } from "@storybook/react";
import { ParentsContainer } from "./ParentsContainer";

const meta: Meta<typeof ParentsContainer> = {
  title: "Views/dashboard/parents/home/ParentsContainer",
  component: ParentsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentsContainer>;

export const Default: Story = {
  args: {},
};
