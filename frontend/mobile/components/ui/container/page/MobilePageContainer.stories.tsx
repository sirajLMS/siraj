import { Box, Card, CardContent, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";

const meta: Meta<typeof MobilePageContainer> = {
  title: "UI/PageContainer/Mobile",
  component: MobilePageContainer,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  decorators: [
    Story => (
      <Box sx={{ width: "100%", p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobilePageContainer>;

function SectionCard({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="titleLg" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {body}
        </Typography>
      </CardContent>
    </Card>
  );
}

export const Default: Story = {
  render: args => (
    <MobilePageContainer {...args}>
      <SectionCard title="Overview" body="Dashboard summary and key metrics for the current term." />
      <SectionCard title="Recent Activity" body="Latest updates from teachers, students, and administrators." />
      <SectionCard title="Quick Actions" body="Shortcuts to common tasks and frequently used pages." />
    </MobilePageContainer>
  ),
};

export const SingleChild: Story = {
  render: args => (
    <MobilePageContainer {...args}>
      <SectionCard
        title="Single Section"
        body="MobilePageContainer with one child — section gap still applies to the flex column layout."
      />
    </MobilePageContainer>
  ),
};

export const CustomSpacing: Story = {
  args: {
    sx: {
      gap: theme => theme.spacing(4),
    },
  },
  render: args => (
    <MobilePageContainer {...args}>
      <SectionCard title="Section One" body="Increased gap between sections via sx override." />
      <SectionCard title="Section Two" body="Useful when page sections need more breathing room." />
    </MobilePageContainer>
  ),
};

export const ArabicRTL: Story = {
  globals: { locale: "ar" },
  render: args => (
    <MobilePageContainer {...args}>
      <SectionCard title="نظرة عامة" body="ملخص لوحة التحكم والمؤشرات الرئيسية للفصل الحالي." />
      <SectionCard title="النشاط الأخير" body="آخر التحديثات من المعلمين والطلاب والإداريين." />
    </MobilePageContainer>
  ),
};
