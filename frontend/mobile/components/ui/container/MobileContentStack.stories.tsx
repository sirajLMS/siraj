import { Box, Button, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container/MobileContentStack";
import {
  CardItem,
  FormItem,
  MixedContentItem,
} from "@/frontend/mobile/components/ui/container/MobileContentStack.stories.fixtures";
import {
  createCardItemsStory,
  createLocaleStory,
  createSingleChildStory,
} from "@/frontend/mobile/components/ui/container/MobileContentStack.stories.helpers";

const meta: Meta<typeof MobileContentStack> = {
  title: "UI/ContentStack/Mobile",
  component: MobileContentStack,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ width: 390, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    gap: {
      control: "number",
      description: "Gap between children in theme spacing units",
    },
    paddingBottom: {
      control: "number",
      description: "Bottom padding in theme spacing units (useful for FAB clearance)",
    },
  },
  args: {
    gap: 3,
    paddingBottom: 4,
  },
  globals: {
    viewport: "mobile",
  },
};

export default meta;
type Story = StoryObj<typeof MobileContentStack>;

export const Default = createCardItemsStory({ count: 4, variant: "outlined" });

export const CustomGap = createCardItemsStory({ count: 5, variant: "elevation", args: { gap: 2 } });

export const LargeGap = createCardItemsStory({ count: 3, variant: "outlined", args: { gap: 4 } });

export const CustomPaddingBottomForFAB = createCardItemsStory({
  count: 4,
  variant: "elevation",
  args: { paddingBottom: 10 },
  children: "Content with extra bottom padding for FAB clearance",
  parameters: {
    viewport: { defaultViewport: "mobile" },
  },
});

export const WithFormContent: Story = {
  render: args => (
    <MobileContentStack {...args}>
      <CardItem index={1}>
        <Typography variant="titleLg" gutterBottom>
          Form Section
        </Typography>
      </CardItem>
      {[1, 2, 3].map(index => (
        <FormItem key={index} index={index} />
      ))}
      <CardItem index={4}>
        <Typography variant="bodyMd">Additional card after form fields</Typography>
      </CardItem>
    </MobileContentStack>
  ),
};

export const MixedContentTypes: Story = {
  render: args => (
    <MobileContentStack {...args}>
      <MixedContentItem index={1} type="text" />
      <MixedContentItem index={2} type="card" />
      <MixedContentItem index={3} type="form" />
      <MixedContentItem index={4} type="card" />
      <MixedContentItem index={5} type="text" />
    </MobileContentStack>
  ),
};

export const WithStackAndButtons: Story = {
  render: args => (
    <MobileContentStack {...args}>
      <CardItem index={1}>
        <Typography variant="titleLg" gutterBottom>
          Action Section
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" size="small">
            Primary Action
          </Button>
          <Button variant="outlined" size="small">
            Secondary
          </Button>
        </Stack>
      </CardItem>
      <CardItem index={2}>
        <Typography variant="bodyMd">Another card with different content</Typography>
      </CardItem>
      <CardItem index={3} variant="elevation">
        <Typography variant="bodyMd">Elevated card for emphasis</Typography>
      </CardItem>
    </MobileContentStack>
  ),
};

export const NoPaddingBottom = createCardItemsStory({ count: 3, variant: "elevation", args: { paddingBottom: 0 } });

export const SmallGapWithManyItems = createCardItemsStory({
  count: 8,
  variant: "outlined",
  args: { gap: 1, paddingBottom: 2 },
});

export const SingleChild = createSingleChildStory();

export const TabletViewport = createCardItemsStory({ count: 3, variant: "outlined", globals: { viewport: "tablet" } });

export const DesktopViewport = createCardItemsStory({
  count: 3,
  variant: "outlined",
  globals: { viewport: "desktop" },
});

export const ArabicLocale = createLocaleStory({
  locale: "ar",
  direction: "rtl",
  title1: "محتوى باللغة العربية",
  body1: "هذا محتوى تجريبي باللغة العربية لاختبار دعم RTL",
  title2: "نموذج عربي",
  fieldLabel: "حقل إدخال",
  fieldPlaceholder: "أدخل قيمة",
});

export const EnglishLocale = createLocaleStory({
  locale: "en",
  direction: "ltr",
  title1: "English Content",
  body1: "This is test content in English for RTL/LTR testing",
  title2: "English Form",
  fieldLabel: "Input Field",
  fieldPlaceholder: "Enter value",
});
