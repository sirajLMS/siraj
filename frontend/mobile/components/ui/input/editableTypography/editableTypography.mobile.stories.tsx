import { Box } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EditableTypographyMobile } from "@/frontend/mobile/components/ui/input/editableTypography/editableTypography.mobile";

type EditableTypographyStoryProps = {
  readonly initialValue?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly doubleClickToEdit?: boolean;
  readonly startEditing?: boolean;
  readonly withValidation?: boolean;
  readonly simulateSaveError?: boolean;
};

function EditableTypographyStory({
  initialValue = "Double-click to edit",
  typographyVariant = "h6",
  doubleClickToEdit = true,
  startEditing = false,
  withValidation = false,
  simulateSaveError = false,
}: Readonly<EditableTypographyStoryProps>) {
  const [value, setValue] = useState(initialValue);

  return (
    <Box sx={{ width: "100%", maxWidth: 375, p: 2 }}>
      <EditableTypographyMobile
        value={value}
        typography={{ variant: typographyVariant }}
        textField={{ fullWidth: true, size: "small" }}
        onSaveAction={async newValue => {
          if (simulateSaveError) {
            return "Unable to save right now";
          }
          setValue(newValue);
        }}
        doubleClickToEdit={doubleClickToEdit}
        startEditing={startEditing}
        isValidAction={
          withValidation ? nextValue => (nextValue.trim().length < 3 ? "Enter at least 3 characters" : null) : undefined
        }
      />
    </Box>
  );
}

const meta: Meta<typeof EditableTypographyStory> = {
  title: "UI/EditableTypography/Mobile",
  component: EditableTypographyStory,
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
type Story = StoryObj<typeof EditableTypographyStory>;

export const Default: Story = {
  args: {
    initialValue: "Project title",
  },
};

export const Editing: Story = {
  args: {
    initialValue: "Editing on load",
    startEditing: true,
  },
};

export const WithValidation: Story = {
  args: {
    initialValue: "Ab",
    startEditing: true,
    withValidation: true,
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialValue: "انقر مرتين للتعديل",
    typographyVariant: "titleLg",
  },
};
