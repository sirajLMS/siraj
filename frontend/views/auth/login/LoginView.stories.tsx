import type { Meta, StoryObj } from "@storybook/react";
import { LoginView } from "./LoginView";
import type { LoginFormData } from "./schemas/loginSchema";

const meta: Meta<typeof LoginView> = {
  title: "Views /login/LoginView",
  component: LoginView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onSubmitAction: async (_data: LoginFormData) => {
      // Pure presentational action, no-op for storybook
    },
    onFastLogin: (_groupSlug: string) => {
      // Pure presentational action, no-op for storybook
    },
    isDemo: false,
    externalLoginResult: null,
  },
  argTypes: {
    isDemo: {
      control: "boolean",
      description: "Controls visibility of the demo quick-login panel.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoginView>;

export const Default: Story = {
  args: {
    isDemo: false,
  },
};

export const Demo: Story = {
  args: {
    isDemo: true,
    demoGroups: [
      { slug: "super_admin", name: "Super Admin", description: null },
      { slug: "teacher", name: "Teacher", description: null },
      { slug: "parent", name: "Parent", description: null },
      { slug: "staff", name: "Staff", description: null },
    ],
  },
};
