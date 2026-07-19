import { Box, Card, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container/MobileHorizontalScrollRow";

const meta: Meta<typeof MobileHorizontalScrollRow> = {
  title: "UI/HorizontalScrollRow/Mobile",
  component: MobileHorizontalScrollRow,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ width: 375, p: 0 }}>
        <Story />
      </Box>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
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
  argTypes: {
    showScrollbar: {
      control: "boolean",
    },
  },
  args: {
    leadSpacing: 0.5,
    showScrollbar: false,
  },
};

export default meta;
type Story = StoryObj<typeof MobileHorizontalScrollRow>;

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
    <MobileHorizontalScrollRow {...args}>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </MobileHorizontalScrollRow>
  ),
};

export const WithScrollbarVisible: Story = {
  render: args => (
    <MobileHorizontalScrollRow {...args} showScrollbar>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </MobileHorizontalScrollRow>
  ),
};

export const LeadSpacingIncreased: Story = {
  render: args => (
    <MobileHorizontalScrollRow {...args} leadSpacing={2}>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </MobileHorizontalScrollRow>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: args => (
    <MobileHorizontalScrollRow {...args}>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </MobileHorizontalScrollRow>
  ),
};
