import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";

const meta: Meta<typeof DesktopPageContainer> = {
  title: "UI/PageContainer/Desktop",
  component: DesktopPageContainer,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopPageContainer>;

function SampleSection({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Box
      sx={theme => ({
        p: 3,
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.palette.surfaceContainerHigh,
      })}
    >
      <Typography variant="titleLg" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="bodyMd">{body}</Typography>
    </Box>
  );
}

export const Default: Story = {
  render: args => (
    <DesktopPageContainer {...args}>
      <SampleSection
        title="Dashboard Content"
        body="Desktop page wrapper with section gap spacing. DashboardLayout applies outer page margin."
      />
    </DesktopPageContainer>
  ),
};

export const WithMultipleSections: Story = {
  render: args => (
    <DesktopPageContainer {...args}>
      <SampleSection title="Overview" body="Summary metrics and quick actions for the current page." />
      <SampleSection title="Recent Activity" body="Latest updates and notifications appear in this section." />
      <SampleSection title="Details" body="Extended content blocks stack with theme layout.sectionGap spacing." />
    </DesktopPageContainer>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: args => (
    <DesktopPageContainer {...args}>
      <SampleSection
        title="محتوى لوحة التحكم"
        body="غلاف صفحة سطح المكتب مع تباعد الأقسام. يطبق DashboardLayout الهامش الخارجي للصفحة."
      />
    </DesktopPageContainer>
  ),
};
