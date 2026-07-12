import { Box, Card, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";

interface DemoProps {
  readonly label: string;
}

interface ViewContentProps extends DemoProps {
  readonly backgroundColor: (theme: Theme) => string;
  readonly textColor: (theme: Theme) => string;
  readonly minHeight?: number;
  readonly children?: React.ReactNode;
  readonly description?: string;
}

function ViewContent({
  label,
  backgroundColor,
  textColor,
  minHeight = 200,
  children,
  description,
}: Readonly<ViewContentProps>) {
  return (
    <Card
      sx={theme => ({
        p: 3,
        backgroundColor: backgroundColor(theme),
        borderRadius: theme.layout.radius.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        flexDirection: "column",
      })}
    >
      <Typography variant="titleLg" sx={{ color: theme => textColor(theme) }}>
        {label}
      </Typography>
      {description && (
        <Typography variant="bodyMd" sx={{ mt: 1, color: theme => textColor(theme) }}>
          {description}
        </Typography>
      )}
      {children}
    </Card>
  );
}

const MobileContent = (props: Readonly<DemoProps>) => (
  <ViewContent {...props} backgroundColor={t => t.palette.success.light} textColor={t => t.palette.onSuccess} />
);

const DesktopContent = (props: Readonly<DemoProps>) => (
  <ViewContent {...props} backgroundColor={t => t.palette.info.light} textColor={t => t.palette.onInfo} />
);

const meta: Meta<typeof ResponsiveViewSwitch<DemoProps>> = {
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
type Story = StoryObj<typeof ResponsiveViewSwitch<DemoProps>>;

export const Mobile: Story = {
  globals: { viewport: "mobile" },
  render: () => (
    <ResponsiveViewSwitch<DemoProps>
      mobile={MobileContent as ComponentType<Readonly<DemoProps>>}
      desktop={DesktopContent as ComponentType<Readonly<DemoProps>>}
      props={{ label: "Mobile View" }}
    />
  ),
};

export const Tablet: Story = {
  globals: { viewport: "tablet" },
  render: () => (
    <ResponsiveViewSwitch<DemoProps>
      mobile={MobileContent as ComponentType<Readonly<DemoProps>>}
      desktop={DesktopContent as ComponentType<Readonly<DemoProps>>}
      props={{ label: "Tablet View" }}
    />
  ),
};

export const Desktop: Story = {
  globals: { viewport: "desktop" },
  render: () => (
    <ResponsiveViewSwitch<DemoProps>
      mobile={MobileContent as ComponentType<Readonly<DemoProps>>}
      desktop={DesktopContent as ComponentType<Readonly<DemoProps>>}
      props={{ label: "Desktop View" }}
    />
  ),
};

const MobileWarningContent = (props: Readonly<DemoProps>) => (
  <ViewContent
    {...props}
    backgroundColor={t => t.palette.warning.light}
    textColor={t => t.palette.onWarning}
    minHeight={150}
    description="Content optimized for mobile viewport"
  />
);

const DesktopSecondaryContent = (props: Readonly<DemoProps>) => (
  <ViewContent
    {...props}
    backgroundColor={t => t.palette.secondary.light}
    textColor={t => t.palette.onSecondary}
    minHeight={150}
    description="Content optimized for desktop viewport with more space"
  />
);

export const WithCustomContent: Story = {
  globals: { viewport: "mobile" },
  render: () => (
    <ResponsiveViewSwitch<DemoProps>
      mobile={MobileWarningContent as ComponentType<Readonly<DemoProps>>}
      desktop={DesktopSecondaryContent as ComponentType<Readonly<DemoProps>>}
      props={{ label: "Mobile: Stacked Cards" }}
    />
  ),
};
