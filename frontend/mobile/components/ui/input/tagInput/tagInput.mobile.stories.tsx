import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TagInputMobile,
  type TagInputProps,
} from "@/frontend/mobile/components/ui/input/tagInput/tagInput.mobile";

function TagInputStory(props: Readonly<Partial<TagInputProps>>) {
  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <TagInputMobile {...props} />
    </Box>
  );
}

const meta: Meta<typeof TagInputStory> = {
  title: "UI/TagInput/Mobile",
  component: TagInputStory,
  tags: ["ai-generated"],
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
};

export default meta;
type Story = StoryObj<typeof TagInputStory>;

export const Default: Story = {};

export const WithInitialTags: Story = {
  args: {
    initialTags: ["React", "TypeScript", "Next.js"],
  },
};

export const CustomLabels: Story = {
  args: {
    label: "Skills",
    placeholder: "Add a skill and press Enter",
    initialTags: ["GraphQL"],
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialTags: ["رياضيات", "علوم"],
  },
};
