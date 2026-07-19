import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  GenderSelectorMobile,
  type GenderSelectorProps,
} from "@/frontend/mobile/components/ui/input/genderSelector/genderSelector.mobile";

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
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <GenderSelectorMobile gender={gender} setGenderAction={setGender} error={initialError} {...props} />
    </Box>
  );
}

const meta: Meta<typeof GenderSelectorStory> = {
  title: "UI/GenderSelector/Mobile",
  component: GenderSelectorStory,
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
