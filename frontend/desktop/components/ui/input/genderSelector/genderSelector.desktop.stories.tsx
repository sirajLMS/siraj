import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  GenderSelectorDesktop,
  type GenderSelectorProps,
} from "@/frontend/desktop/components/ui/input/genderSelector/genderSelector.desktop";

function GenderSelectorStory({
  initialGender = Gender.Male,
  initialError = false,
  ...props
}: Readonly<
  Partial<GenderSelectorProps> & {
    initialGender?: Gender | null;
    initialError?: boolean;
  }
>) {
  const [gender, setGender] = useState<Gender | null>(initialGender);

  return (
    <Box sx={{ width: 480, p: 2 }}>
      <GenderSelectorDesktop gender={gender} setGenderAction={setGender} error={initialError} {...props} />
    </Box>
  );
}

const meta: Meta<typeof GenderSelectorStory> = {
  title: "UI/GenderSelector/Desktop",
  component: GenderSelectorStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof GenderSelectorStory>;

export const Default: Story = {
  args: {
    initialGender: Gender.Male,
  },
};

export const WithError: Story = {
  args: {
    initialGender: Gender.Male,
    initialError: true,
  },
};

export const AllowAny: Story = {
  args: {
    initialGender: null,
    allowEmpty: true,
    labels: { any: "Any" },
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialGender: Gender.Female,
  },
};
