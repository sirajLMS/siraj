import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";
import {
  MockedAuditProviders,
  PayrollPermissionsResync,
} from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer.stories.providers.helpers";

const meta: Meta<typeof ClassAuditContainer> = {
  title: "Views/dashboard/classes/audit/ClassAuditContainer",
  component: ClassAuditContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <MockedAuditProviders>
        <Story />
      </MockedAuditProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClassAuditContainer>;

export const Default: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/classes/story-class-id/audit",
        segments: [["id", "story-class-id"]],
      },
    },
  },
  args: {},
};

/**
 * Mirrors the state a payroll manager lands in after following the reports
 * grid's "open audit page" action: the audit view behind it and the payroll
 * override dialog already open over the instance snapshot.
 */
export const OverrideDialogFromDeepLink: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/classes/story-class-id/audit",
        segments: [["id", "story-class-id"]],
        query: { openOverride: "1" },
      },
    },
  },
  decorators: [
    Story => (
      <PayrollPermissionsResync>
        <Story />
      </PayrollPermissionsResync>
    ),
  ],
};
