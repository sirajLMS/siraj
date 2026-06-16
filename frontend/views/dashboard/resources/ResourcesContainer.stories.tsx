import type { Meta, StoryObj } from "@storybook/react";
import { ResourcesContainer } from "./ResourcesContainer";

const meta: Meta<typeof ResourcesContainer> = {
  title: "Views/dashboard/resources/ResourcesContainer",
  component: ResourcesContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ResourcesContainer>;

export const Default: Story = {
  args: {},
};
