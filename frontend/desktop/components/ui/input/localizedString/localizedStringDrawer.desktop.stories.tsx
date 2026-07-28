import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localizedStringDrawer.desktop";
import type { LocalizedString } from "@/shared/types/localized-string";

function LocalizedStringDrawerDesktopStory({
  initialValue,
  required = true,
  autosave = false,
  showActions,
  dismissAction = "save",
  multiline,
  minRows,
}: Readonly<{
  initialValue: LocalizedString;
  required?: boolean;
  autosave?: boolean;
  showActions?: boolean;
  dismissAction?: "save" | "cancel";
  multiline?: boolean;
  minRows?: number;
}>) {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState<LocalizedString>(initialValue);

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <LocalizedStringDrawerDesktop
        open={open}
        value={value}
        title="Edit translations — Name"
        required={required}
        autosave={autosave}
        showActions={showActions}
        dismissAction={dismissAction}
        multiline={multiline}
        minRows={minRows}
        onSaveAction={next => {
          setValue(next);
          if (!autosave) {
            setOpen(false);
          }
        }}
        onCancelAction={() => setOpen(false)}
      />
    </Box>
  );
}

const meta: Meta<typeof LocalizedStringDrawerDesktopStory> = {
  title: "UI/LocalizedStringDrawer/Desktop",
  component: LocalizedStringDrawerDesktopStory,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof LocalizedStringDrawerDesktopStory>;

export const Default: Story = {
  render: () => <LocalizedStringDrawerDesktopStory initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} />,
};

export const EmptySaveDisabled: Story = {
  render: () => <LocalizedStringDrawerDesktopStory initialValue={{}} />,
};

export const RequiredError: Story = {
  render: () => <LocalizedStringDrawerDesktopStory initialValue={{ en: "Vodafone Cash" }} />,
};

export const Multiline: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <LocalizedStringDrawerDesktop
        open
        value={{ ar: "تعليمات الدفع", en: "Payment instructions" }}
        title="Instructions"
        required={false}
        multiline
        minRows={4}
        onSaveAction={() => undefined}
        onCancelAction={() => undefined}
      />
    </Box>
  ),
};
