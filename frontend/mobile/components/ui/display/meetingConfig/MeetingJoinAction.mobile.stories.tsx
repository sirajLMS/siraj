import { Box, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EffectiveMeetingSource } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig/MeetingJoinAction.mobile";

const mockMeeting: EffectiveMeetingFieldsFragment = {
  id: "mock-meeting-1",
  joinUrl: "https://meet.example.com/abc-123",
  providerSlug: "zoom",
  providerName: { en: "Zoom", ar: "زووم" },
  logoUrl: null,
  meetingId: "123-456-789",
  source: EffectiveMeetingSource.Class,
  configId: "cfg-1",
  providerId: "prov-1",
  supportsAutoGeneration: false,
};

const meta: Meta<typeof MobileMeetingJoinAction> = {
  title: "UI/MeetingJoinAction/Mobile",
  component: MobileMeetingJoinAction,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileMeetingJoinAction>;

export const Default: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <MobileMeetingJoinAction joinUrl="https://meet.example.com/abc-123" meeting={mockMeeting} />
    </Box>
  ),
};

export const ButtonVariant: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <MobileMeetingJoinAction
        joinUrl="https://meet.example.com/abc-123"
        meeting={mockMeeting}
        variant="button"
        label="Join meeting"
      />
    </Box>
  ),
};

export const IconVariant: Story = {
  render: () => (
    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
      <MobileMeetingJoinAction joinUrl="https://meet.example.com/abc-123" meeting={mockMeeting} variant="icon" />
    </Box>
  ),
};

export const SetupRequired: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <MobileMeetingJoinAction emptyRole="teacher" setupHref="/dashboard/profile/meeting" />
    </Box>
  ),
};

export const DisabledIcon: Story = {
  render: () => (
    <Stack sx={{ p: 2, alignItems: "center" }}>
      <MobileMeetingJoinAction variant="icon" disabled />
    </Stack>
  ),
};

const urlPendingMeeting: EffectiveMeetingFieldsFragment = {
  id: "mock-meeting-url-pending",
  joinUrl: null,
  providerSlug: "zoom",
  providerName: { en: "Zoom", ar: "زووم" },
  logoUrl: null,
  meetingId: null,
  source: EffectiveMeetingSource.Class,
  configId: "cfg-1",
  providerId: "prov-1",
  supportsAutoGeneration: true,
};

export const UrlPendingAction: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <MobileMeetingJoinAction meeting={urlPendingMeeting} />
    </Box>
  ),
};

export const UrlPendingButton: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <MobileMeetingJoinAction meeting={urlPendingMeeting} variant="button" label="Join meeting" />
    </Box>
  ),
};

export const UrlPendingIcon: Story = {
  render: () => (
    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
      <MobileMeetingJoinAction meeting={urlPendingMeeting} variant="icon" />
    </Box>
  ),
};
