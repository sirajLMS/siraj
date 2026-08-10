import { Box } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { EditableTypography } from "@/frontend/common/components/ui/input/editableTypography/EditableTypography";

type EditableTypographyStoryProps = {
  readonly initialValue?: string;
  readonly typographyVariant?: NonNullable<TypographyProps["variant"]>;
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
      <EditableTypography
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
  title: "UI/Input/EditableTypography",
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

export const SingleClickToEdit: Story = {
  args: {
    initialValue: "Single click to edit",
    doubleClickToEdit: false,
  },
};

export const WithValidation: Story = {
  args: {
    initialValue: "Ab",
    startEditing: true,
    withValidation: true,
  },
};

export const SaveError: Story = {
  args: {
    initialValue: "Try saving me",
    startEditing: true,
    simulateSaveError: true,
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
