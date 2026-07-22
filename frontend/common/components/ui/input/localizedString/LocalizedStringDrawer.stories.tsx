import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import type { LocalizedString } from "@/shared/types";

const meta: Meta<typeof LocalizedStringDrawer> = {
  title: "UI/Input/LocalizedStringDrawer",
  component: LocalizedStringDrawer,
  tags: ["ai-generated"],
};

const mobileViewport = { defaultViewport: "mobile1" as const };

export default meta;
type Story = StoryObj<typeof LocalizedStringDrawer>;

function DrawerPlayground({
  initialValue,
  required = true,
  autosave = false,
  showActions,
  dismissAction = "save",
}: Readonly<{
  initialValue: LocalizedString;
  required?: boolean;
  autosave?: boolean;
  showActions?: boolean;
  dismissAction?: "save" | "cancel";
}>) {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState<LocalizedString>(initialValue);

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <LocalizedStringDrawer
        open={open}
        value={value}
        title="Edit translations — Name"
        required={required}
        autosave={autosave}
        showActions={showActions}
        dismissAction={dismissAction}
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

export const TwoLocales: Story = {
  render: () => <DrawerPlayground initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} />,
};

export const EmptySaveDisabled: Story = {
  render: () => <DrawerPlayground initialValue={{}} />,
};

export const RequiredError: Story = {
  render: () => <DrawerPlayground initialValue={{ en: "Vodafone Cash" }} />,
};

export const Multiline: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <LocalizedStringDrawer
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

export const MobileBottomSheet: Story = {
  parameters: {
    viewport: mobileViewport,
    docs: {
      description: {
        story: "Bottom sheet at md breakpoint: Cancel and Save on one row, equal width.",
      },
    },
  },
  render: () => <DrawerPlayground initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} />,
};

export const DismissCancels: Story = {
  render: () => <DrawerPlayground initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} dismissAction="cancel" />,
};

export const AutosaveNoFooter: Story = {
  render: () => <DrawerPlayground initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} autosave />,
};

export const AutosaveMobileBottomSheet: Story = {
  parameters: {
    viewport: mobileViewport,
    docs: {
      description: {
        story: "Autosave: edits commit on each keystroke; footer hidden; close via header ×.",
      },
    },
  },
  render: () => <DrawerPlayground initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} autosave />,
};
