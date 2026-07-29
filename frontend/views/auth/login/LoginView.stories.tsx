import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginView, type LoginViewProps } from "@/frontend/views/auth/login/LoginView";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import { Translation, useAppTranslation } from "@/shared/locale";

function LoginViewWithLabels(props: Omit<LoginViewProps, "labels">) {
  const labels = useAppTranslation(Translation.Auth.Login);
  return <LoginView labels={labels} {...props} />;
}

const meta: Meta<typeof LoginViewWithLabels> = {
  title: "Views /login/LoginView",
  component: LoginViewWithLabels,
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
type Story = StoryObj<typeof LoginViewWithLabels>;

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
