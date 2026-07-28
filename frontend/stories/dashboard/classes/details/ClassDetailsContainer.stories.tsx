import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { seedPermissions } from "@/frontend/common/stories";
import { ClassDetailsContainer } from "@/frontend/common/views/dashboard/classes/details/ClassDetailsContainer";

const meta = {
  title: "Views/dashboard/classes/details/ClassDetailsContainer",
  component: ClassDetailsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ClassDetailsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SessionViewDetails]);
      return <Story />;
    },
  ],
};

export const ForceActivateEnabled: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SessionOverrideActions]);
      return <Story />;
    },
  ],
};

export const ForceActivateDisabled: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SessionViewDetails]);
      return <Story />;
    },
  ],
};
