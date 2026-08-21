import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { LiveSessionToolbar } from "@/frontend/common/views/dashboard/classes/details/components/LiveSessionToolbar";

const meta: Meta<typeof LiveSessionToolbar> = {
  title: "Dashboard/Classes/LiveSessionToolbar",
  component: LiveSessionToolbar,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof LiveSessionToolbar>;

const baseArgs = {
  classInstanceId: "1",
  executionState: "ACTIVATED",
  onStart: () => {
    logger.info("Start clicked in Storybook");
  },
  onAbsent: () => {
    logger.info("Absent clicked in Storybook");
  },
  onLeave: (reason: string) => {
    logger.info("Leave clicked in Storybook with reason:", reason);
  },
  onReset: () => {
    logger.info("Reset clicked in Storybook");
  },
};

export const TeacherView: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      // Seed teacher permissions (NO reset)
      const permissions = [
        AppPermission.SessionUpdateStatusStart,
        AppPermission.SessionUpdateStatusAbsent,
        AppPermission.SessionUpdateStatusLeave,
      ];
      const state = useUserStore.getState();
      const user = state.user
        ? {
            ...state.user,
            permissions,
          }
        : null;
      useUserStore.setState({
        permissions,
        user,
      });
      return <Story />;
    },
  ],
};

export const AdminView: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      // Seed admin permissions (includes reset)
      const permissions = [
        AppPermission.SessionUpdateStatusStart,
        AppPermission.SessionUpdateStatusAbsent,
        AppPermission.SessionUpdateStatusLeave,
        AppPermission.SessionReset,
      ];
      const state = useUserStore.getState();
      const user = state.user
        ? {
            ...state.user,
            permissions,
          }
        : null;
      useUserStore.setState({
        permissions,
        user,
      });
      return <Story />;
    },
  ],
};

export const WithError: Story = {
  args: {
    ...baseArgs,
    error: "Waiting period has not elapsed. Please wait 15 more minutes.",
  },
  decorators: [
    Story => {
      const permissions = [AppPermission.SessionUpdateStatusAbsent];
      const state = useUserStore.getState();
      const user = state.user
        ? {
            ...state.user,
            permissions,
          }
        : null;
      useUserStore.setState({
        permissions,
        user,
      });
      return <Story />;
    },
  ],
};

export const LoadingState: Story = {
  args: {
    ...baseArgs,
    isStarting: true,
  },
  decorators: [
    Story => {
      const permissions = [AppPermission.SessionUpdateStatusStart];
      const state = useUserStore.getState();
      const user = state.user
        ? {
            ...state.user,
            permissions,
          }
        : null;
      useUserStore.setState({
        permissions,
        user,
      });
      return <Story />;
    },
  ],
};

export const RunningState: Story = {
  args: {
    ...baseArgs,
    executionState: "RUNNING",
  },
  decorators: [
    Story => {
      const permissions = [AppPermission.SessionReset];
      const state = useUserStore.getState();
      const user = state.user
        ? {
            ...state.user,
            permissions,
          }
        : null;
      useUserStore.setState({
        permissions,
        user,
      });
      return <Story />;
    },
  ],
};
