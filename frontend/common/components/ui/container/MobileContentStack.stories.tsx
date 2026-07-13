import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileContentStack } from "@/frontend/common/components/ui/container/MobileContentStack";

const meta: Meta<typeof MobileContentStack> = {
  title: "UI/Container/MobileContentStack",
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

function CardItem({
  index,
  variant = "outlined",
  children,
}: Readonly<{ index: number; variant?: "outlined" | "elevation"; children?: React.ReactNode }>) {
  return (
    <Card variant={variant} sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="bodyMd">{children ?? `Card Item ${index}`}</Typography>
      </CardContent>
    </Card>
  );
}

function FormItem({ index }: Readonly<{ index: number }>) {
  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <TextField label={`Field ${index}`} placeholder={`Enter value ${index}`} fullWidth size="small" />
    </Box>
  );
}

function MixedContentItem({ index, type }: Readonly<{ index: number; type: "card" | "form" | "text" }>) {
  switch (type) {
    case "card":
      return (
        <CardItem index={index} variant="elevation">
          Elevated Card Content
        </CardItem>
      );
    case "form":
      return <FormItem index={index} />;
    case "text":
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="bodyMd" color="text.secondary">
            Plain text content item {index}
          </Typography>
        </Box>
      );
    default:
      return <CardItem index={index} />;
  }
}

function createLocaleStory({
  locale,
  direction,
  title1,
  body1,
  title2,
  fieldLabel,
  fieldPlaceholder,
}: {
  locale: "ar" | "en";
  direction: "rtl" | "ltr";
  title1: string;
  body1: string;
  title2: string;
  fieldLabel: string;
  fieldPlaceholder: string;
}): Story {
  return {
    globals: { locale, viewport: "mobile" },
    render: args => (
      <MobileContentStack {...args} sx={{ direction }}>
        <CardItem index={1} variant="outlined">
          <Typography variant="titleLg" gutterBottom>
            {title1}
          </Typography>
          <Typography variant="bodyMd">{body1}</Typography>
        </CardItem>
        <CardItem index={2} variant="outlined">
          <Typography variant="titleLg" gutterBottom>
            {title2}
          </Typography>
          <TextField label={fieldLabel} placeholder={fieldPlaceholder} fullWidth size="small" />
        </CardItem>
      </MobileContentStack>
    ),
  };
}

export const Default: Story = {
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3, 4].map(index => (
        <CardItem key={index} index={index} />
      ))}
    </MobileContentStack>
  ),
};

export const CustomGap: Story = {
  args: {
    gap: 2,
  },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3, 4, 5].map(index => (
        <CardItem key={index} index={index} variant="elevation" />
      ))}
    </MobileContentStack>
  ),
};

export const LargeGap: Story = {
  args: {
    gap: 4,
  },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3].map(index => (
        <CardItem key={index} index={index} variant="outlined" />
      ))}
    </MobileContentStack>
  ),
};

export const CustomPaddingBottomForFAB: Story = {
  args: {
    paddingBottom: 10,
  },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3, 4].map(index => (
        <CardItem key={index} index={index} variant="elevation">
          Content with extra bottom padding for FAB clearance
        </CardItem>
      ))}
    </MobileContentStack>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile" },
  },
};

export const WithFormContent: Story = {
  render: args => (
    <MobileContentStack {...args}>
      <CardItem index={1} variant="outlined">
        <Typography variant="titleLg" gutterBottom>
          Form Section
        </Typography>
      </CardItem>
      {[1, 2, 3].map(index => (
        <FormItem key={index} index={index} />
      ))}
      <CardItem index={4} variant="outlined">
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
      <CardItem index={1} variant="outlined">
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
      <CardItem index={2} variant="outlined">
        <Typography variant="bodyMd">Another card with different content</Typography>
      </CardItem>
      <CardItem index={3} variant="elevation">
        <Typography variant="bodyMd">Elevated card for emphasis</Typography>
      </CardItem>
    </MobileContentStack>
  ),
};

export const NoPaddingBottom: Story = {
  args: {
    paddingBottom: 0,
  },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3].map(index => (
        <CardItem key={index} index={index} variant="elevation" />
      ))}
    </MobileContentStack>
  ),
};

export const SmallGapWithManyItems: Story = {
  args: {
    gap: 1,
    paddingBottom: 2,
  },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(index => (
        <CardItem key={index} index={index} variant="outlined" />
      ))}
    </MobileContentStack>
  ),
};

export const SingleChild: Story = {
  render: args => (
    <MobileContentStack {...args}>
      <CardItem index={1} variant="elevation">
        <Typography variant="headlineMd" gutterBottom>
          Single Child
        </Typography>
        <Typography variant="bodyMd">
          This MobileContentStack has only one child with default gap and padding.
        </Typography>
      </CardItem>
    </MobileContentStack>
  ),
};

export const TabletViewport: Story = {
  globals: { viewport: "tablet" },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3].map(index => (
        <CardItem key={index} index={index} variant="outlined" />
      ))}
    </MobileContentStack>
  ),
};

export const DesktopViewport: Story = {
  globals: { viewport: "desktop" },
  render: args => (
    <MobileContentStack {...args}>
      {[1, 2, 3].map(index => (
        <CardItem key={index} index={index} variant="outlined" />
      ))}
    </MobileContentStack>
  ),
};

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
