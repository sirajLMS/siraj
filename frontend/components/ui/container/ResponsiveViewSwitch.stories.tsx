import { Box, Card, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";

const meta: Meta<typeof ResponsiveViewSwitch> = {
  title: "UI/Container/ResponsiveViewSwitch",
  component: ResponsiveViewSwitch,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ p: 2, minHeight: 200 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResponsiveViewSwitch>;

function MobileContent() {
  return (
    <Card
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.success.light,
        borderRadius: theme.layout.radius.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
      })}
    >
      <Typography variant="titleLg" sx={{ color: theme => theme.palette.onSuccess }}>
        Mobile View
      </Typography>
    </Card>
  );
}

function DesktopContent() {
  return (
    <Card
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.info.light,
        borderRadius: theme.layout.radius.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
      })}
    >
      <Typography variant="titleLg" sx={{ color: theme => theme.palette.onInfo }}>
        Desktop View
      </Typography>
    </Card>
  );
}

export const Mobile: Story = {
  globals: { viewport: "mobile" },
  render: () => <ResponsiveViewSwitch mobile={<MobileContent />} desktop={<DesktopContent />} />,
};

export const Tablet: Story = {
  globals: { viewport: "tablet" },
  render: () => <ResponsiveViewSwitch mobile={<MobileContent />} desktop={<DesktopContent />} />,
};

export const Desktop: Story = {
  globals: { viewport: "desktop" },
  render: () => <ResponsiveViewSwitch mobile={<MobileContent />} desktop={<DesktopContent />} />,
};

export const WithCustomContent: Story = {
  globals: { viewport: "mobile" },
  render: () => (
    <ResponsiveViewSwitch
      mobile={
        <Card
          sx={theme => ({
            p: 3,
            backgroundColor: theme.palette.warning.light,
            borderRadius: theme.layout.radius.card,
            color: theme.palette.onWarning,
            minHeight: 150,
          })}
        >
          <Typography variant="titleLg">Mobile: Stacked Cards</Typography>
          <Typography variant="bodyMd" sx={{ mt: 1 }}>
            Content optimized for mobile viewport
          </Typography>
        </Card>
      }
      desktop={
        <Card
          sx={theme => ({
            p: 3,
            backgroundColor: theme.palette.secondary.light,
            borderRadius: theme.layout.radius.card,
            color: theme.palette.onSecondary,
            minHeight: 150,
          })}
        >
          <Typography variant="titleLg">Desktop: Data Grid</Typography>
          <Typography variant="bodyMd" sx={{ mt: 1 }}>
            Content optimized for desktop viewport with more space
          </Typography>
        </Card>
      }
    />
  ),
};
