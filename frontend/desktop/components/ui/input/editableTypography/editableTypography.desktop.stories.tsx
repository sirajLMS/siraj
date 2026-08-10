import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { EditableTypographyDesktop } from "@/frontend/desktop/components/ui/input/editableTypography/editableTypography.desktop";

type EditableTypographyStoryProps = {
  readonly initialValue?: string;
  readonly typographyVariant?: UiTypographyVariant;
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
    <Box sx={{ width: 480, p: 2 }}>
      <EditableTypographyDesktop
        value={value}
        typography={{ variant: typographyVariant }}
        textField={{ fullWidth: true, size: "small" }}
        onSaveAction={async newValue => {
          if (simulateSaveError) {
            return "Unable to save right now";
          }
          setValue(newValue);
          return undefined;
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
  title: "UI/EditableTypography/Desktop",
  component: EditableTypographyStory,
  tags: ["ai-generated"],
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
