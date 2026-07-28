import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { LocalizedStringDrawerMobile } from "@/frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile";
import type { LocalizedString } from "@/shared/types/localized-string";

function LocalizedStringDrawerMobileStory({
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
      <LocalizedStringDrawerMobile
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

const meta: Meta<typeof LocalizedStringDrawerMobileStory> = {
  title: "UI/LocalizedStringDrawer/Mobile",
  component: LocalizedStringDrawerMobileStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalizedStringDrawerMobileStory>;

export const Default: Story = {
  render: () => <LocalizedStringDrawerMobileStory initialValue={{ ar: "فودافون كاش", en: "Vodafone Cash" }} />,
};

export const EmptySaveDisabled: Story = {
  render: () => <LocalizedStringDrawerMobileStory initialValue={{}} />,
};

export const RequiredError: Story = {
  render: () => <LocalizedStringDrawerMobileStory initialValue={{ en: "Vodafone Cash" }} />,
};

export const Multiline: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <LocalizedStringDrawerMobile
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
