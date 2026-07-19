import { Box, Card, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopHorizontalScrollRow } from "@/frontend/desktop/components/ui/container/DesktopHorizontalScrollRow";

const meta: Meta<typeof DesktopHorizontalScrollRow> = {
  title: "UI/HorizontalScrollRow/Desktop",
  component: DesktopHorizontalScrollRow,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ width: 480, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    showScrollbar: {
      control: "select",
      options: [false, true, "desktop"],
    },
  },
  args: {
    leadSpacing: 0.5,
    showScrollbar: false,
  },
};

export default meta;
type Story = StoryObj<typeof DesktopHorizontalScrollRow>;

function CardItem({ index }: Readonly<{ index: number }>) {
  return (
    <Card
      sx={theme => ({
        flex: "0 0 140px",
        width: 140,
        height: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.surfaceContainerHigh,
        borderRadius: theme.layout.radius.card,
      })}
    >
      <Typography variant="titleLg">Card {index}</Typography>
    </Card>
  );
}

export const Default: Story = {
  render: args => (
    <DesktopHorizontalScrollRow {...args}>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </DesktopHorizontalScrollRow>
  ),
};

export const WithScrollbarVisible: Story = {
  render: args => (
    <DesktopHorizontalScrollRow {...args} showScrollbar>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </DesktopHorizontalScrollRow>
  ),
};

export const DesktopOnlyScrollbar: Story = {
  render: args => (
    <DesktopHorizontalScrollRow {...args} showScrollbar="desktop">
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </DesktopHorizontalScrollRow>
  ),
};

export const LeadSpacingIncreased: Story = {
  render: args => (
    <DesktopHorizontalScrollRow {...args} leadSpacing={2}>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </DesktopHorizontalScrollRow>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: args => (
    <DesktopHorizontalScrollRow {...args}>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </DesktopHorizontalScrollRow>
  ),
};
