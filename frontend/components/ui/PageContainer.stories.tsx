import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PageContainer } from "./PageContainer";

const meta: Meta<typeof PageContainer> = {
  title: "UI/PageContainer",
  component: PageContainer,
  tags: ["ai-generated"],
  args: {
    children: (
      <>
        <Box
          sx={theme => ({
            p: 2,
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            borderRadius: 2,
          })}
        >
          <Typography variant="titleLg">Section 1</Typography>
        </Box>
        <Box
          sx={theme => ({
            p: 2,
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
            borderRadius: 2,
          })}
        >
          <Typography variant="titleLg">Section 2</Typography>
        </Box>
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof PageContainer>;

export const Default: Story = {};
