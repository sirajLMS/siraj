import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LocalizedStringInput } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringInput";

const meta: Meta<typeof LocalizedStringInput> = {
  title: "UI/Input/LocalizedStringInput",
  component: LocalizedStringInput,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 640 }}>
        <Story />
      </Box>
    ),
  ],
};

const mobileViewport = { defaultViewport: "mobile1" as const };

export default meta;
type Story = StoryObj<typeof LocalizedStringInput>;

export const InlineArabic: Story = {
  args: {
    label: "Name",
    required: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const InlineEnglish: Story = {
  globals: { locale: "en" },
  args: {
    label: "Name",
    required: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const InlineEmpty: Story = {
  args: {
    label: "Name",
    required: true,
    value: {},
  },
};

export const InlineRequiredError: Story = {
  args: {
    label: "Name",
    required: true,
    error: true,
    errorMessage: "Arabic is required for this field",
    value: { en: "Vodafone Cash" },
  },
};

export const InlineMultiline: Story = {
  args: {
    label: "Description",
    multiline: true,
    minRows: 3,
    required: false,
    value: { ar: "محفظة دفع إلكتروني آمنة عبر الهاتف", en: "Secure mobile phone payment wallet" },
  },
};

export const InlineArabicChrome: Story = {
  globals: { locale: "ar" },
  args: {
    label: "الاسم",
    required: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const InlineDisabled: Story = {
  args: {
    label: "Name",
    required: true,
    disabled: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const InlineReadOnly: Story = {
  args: {
    label: "Name",
    required: true,
    disabled: true,
    disableDrawer: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const NarrowDesktopPanel: Story = {
  parameters: {
    docs: {
      description: {
        story: "Desktop viewport but 320px-wide panel: compact adornments (flag+chevron, icon-only edit).",
      },
    },
  },
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 320 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    label: "Name",
    required: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const MobileInlineCompact: Story = {
  parameters: {
    viewport: mobileViewport,
    docs: { description: { story: "At mobile width: flag+chevron only, icon-only edit button." } },
  },
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 375 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    label: "Name",
    required: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};

export const MobileArabicChrome: Story = {
  globals: { locale: "ar" },
  parameters: { viewport: mobileViewport },
  decorators: [
    Story => (
      <Box sx={{ p: 2, maxWidth: 375 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    label: "الاسم",
    required: true,
    value: { ar: "فودافون كاش", en: "Vodafone Cash" },
  },
};
