import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { GenderSelector, type GenderSelectorProps } from "@/frontend/components/ui/input/genderSelector/GenderSelector";
import { Gender } from "@/frontend/graphql/generated/gql/graphql-types";

function GenderSelectorStory({
  initialGender = Gender.Male,
  initialError = false,
  ...props
}: Readonly<
  Partial<GenderSelectorProps> & {
    initialGender?: Gender;
    initialError?: boolean;
  }
>) {
  const [gender, setGender] = useState(initialGender);
  const [error, setError] = useState(initialError);

  return (
    <Box sx={{ width: 480, p: 2 }}>
      <GenderSelector gender={gender} setGender={setGender} error={error} setError={setError} {...props} />
    </Box>
  );
}

const meta: Meta<typeof GenderSelectorStory> = {
  title: "UI/Input/GenderSelector",
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

export const FemaleSelected: Story = {
  args: {
    initialGender: Gender.Female,
  },
};

export const WithError: Story = {
  args: {
    initialGender: Gender.Male,
    initialError: true,
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
