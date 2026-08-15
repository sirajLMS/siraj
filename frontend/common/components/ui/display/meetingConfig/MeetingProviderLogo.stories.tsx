import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MeetingProviderLogo } from "@/frontend/common/components/ui/display/meetingConfig/MeetingProviderLogo";

const meta = {
  title: "Components/ui/display/meetingConfig/MeetingProviderLogo",
  component: MeetingProviderLogo,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof MeetingProviderLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ZoomSmall: Story = { args: { providerSlug: "zoom", providerName: "Zoom", size: "small" } };

export const ZoomMedium: Story = { args: { providerSlug: "zoom", providerName: "Zoom", size: "medium" } };

export const ZoomLarge: Story = { args: { providerSlug: "zoom", providerName: "Zoom", size: "large" } };

export const GoogleMeet: Story = { args: { providerSlug: "google_meet", providerName: "Google Meet" } };

export const MicrosoftTeams: Story = { args: { providerSlug: "microsoft_teams", providerName: "Microsoft Teams" } };

export const CustomProvider: Story = { args: { providerSlug: "custom", providerName: "Acme Meetings" } };

export const UnknownSlugFallback: Story = { args: { providerSlug: null, providerName: "Unknown Provider" } };

export const WithLogoUrl: Story = {
  args: {
    providerSlug: "acme_meetings",
    providerName: "Acme Meetings",
    logoUrl: "/meeting-providers/custom.svg",
  },
};

export const AllProviders: Story = {
  render: () => (
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <MeetingProviderLogo providerSlug="zoom" providerName="Zoom" size="small" />
        <Typography variant="caption">Zoom (small)</Typography>
      </Stack>
      <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <MeetingProviderLogo providerSlug="google_meet" providerName="Google Meet" size="medium" />
        <Typography variant="caption">Google Meet (medium)</Typography>
      </Stack>
      <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <MeetingProviderLogo providerSlug="microsoft_teams" providerName="Microsoft Teams" size="large" />
        <Typography variant="caption">Microsoft Teams (large)</Typography>
      </Stack>
      <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <MeetingProviderLogo providerSlug={null} providerName="Custom" size="medium" />
        <Typography variant="caption">Fallback icon</Typography>
      </Stack>
    </Stack>
  ),
};
