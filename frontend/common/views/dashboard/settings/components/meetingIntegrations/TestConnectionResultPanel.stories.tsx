import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  MeetingConnectionTestMode as MeetingConnectionTestModeEnum,
  MeetingIntegrationProviderSlug as MeetingIntegrationProviderSlugEnum,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import { TestConnectionResultPanel } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel";
import type {
  MeetingConnectionTestMode,
  MeetingIntegrationProviderSlug,
  TestMeetingConnectionResult,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const meta = {
  title: "Views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel",
  component: TestConnectionResultPanel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof TestConnectionResultPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: SettingsMeetingIntegrationsLabels = createMeetingIntegrationLabelsMock();

const noopRun = async (_slug: MeetingIntegrationProviderSlug, _mode: MeetingConnectionTestMode) => {};

const providerSlug: MeetingIntegrationProviderSlug = MeetingIntegrationProviderSlugEnum.Zoom;

const successResult: TestMeetingConnectionResult = {
  ok: true,
  latencyMs: 142,
  mode: MeetingConnectionTestModeEnum.ValidateConfig,
  testJoinUrl: "https://zoom.us/j/123456789?pwd=test",
  deleted: null,
  upstreamResponseSummary: "OK",
  errorCode: null,
  errorMessage: null,
  rawUpstreamPayload: null,
  requiredScopes: ["meeting:write", "user:read"],
  grantedScopes: ["meeting:write", "user:read"],
};

const errorResult: TestMeetingConnectionResult = {
  ok: false,
  latencyMs: 5300,
  mode: MeetingConnectionTestModeEnum.GenerateAndDelete,
  testJoinUrl: null,
  deleted: false,
  upstreamResponseSummary: "Unauthorized",
  errorCode: "INVALID_CREDENTIALS",
  errorMessage: "The provided client secret was rejected by the provider.",
  rawUpstreamPayload: { error: "invalid_grant" },
  requiredScopes: ["meeting:write"],
  grantedScopes: [],
};

const generateDeletedResult: TestMeetingConnectionResult = {
  ok: true,
  latencyMs: 2100,
  mode: MeetingConnectionTestModeEnum.GenerateAndDelete,
  testJoinUrl: "https://zoom.us/j/987654321?pwd=deleted",
  deleted: true,
  upstreamResponseSummary: "Meeting created and deleted successfully",
  errorCode: null,
  errorMessage: null,
  rawUpstreamPayload: { id: "987654321", status: "deleted" },
  requiredScopes: ["meeting:write", "user:read"],
  grantedScopes: ["meeting:write", "user:read"],
};

export const NoResult: Story = {
  args: {
    labels,
    result: null,
    testing: false,
    providerSlug,
    onRunTest: noopRun,
  },
};

export const SuccessResult: Story = {
  args: {
    labels,
    result: successResult,
    testing: false,
    providerSlug,
    onRunTest: noopRun,
  },
};

export const ErrorResult: Story = {
  args: {
    labels,
    result: errorResult,
    testing: false,
    providerSlug,
    onRunTest: noopRun,
  },
};

export const Testing: Story = {
  args: {
    labels,
    result: null,
    testing: true,
    providerSlug,
    onRunTest: noopRun,
  },
};

export const GenerateAndDeletedResult: Story = {
  args: {
    labels,
    result: generateDeletedResult,
    testing: false,
    providerSlug,
    onRunTest: noopRun,
  },
};
