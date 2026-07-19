import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
