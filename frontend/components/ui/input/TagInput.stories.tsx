import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { TagInput, type TagInputProps } from "@/frontend/components/ui/input/TagInput";

function TagInputStory(props: Readonly<Partial<TagInputProps>>) {
  return (
    <Box sx={{ width: 480, p: 2 }}>
      <TagInput {...props} />
    </Box>
  );
}

const meta: Meta<typeof TagInputStory> = {
  title: "UI/Input/TagInput",
  component: TagInputStory,
  tags: ["ai-generated"],
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
