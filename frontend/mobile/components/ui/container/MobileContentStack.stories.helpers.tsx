import { TextField, Typography } from "@mui/material";
import type { StoryObj } from "@storybook/nextjs-vite";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container/MobileContentStack";
import { CardItem, CardItemsList } from "@/frontend/mobile/components/ui/container/MobileContentStack.stories.fixtures";

type Story = StoryObj<typeof MobileContentStack>;
type StoryArgs = NonNullable<Story["args"]>;
type StoryGlobals = NonNullable<Story["globals"]>;
type StoryParameters = NonNullable<Story["parameters"]>;

export function createCardItemsStory({
  count,
  variant,
  args,
  children,
  globals,
  parameters,
}: {
  count: number;
  variant: "outlined" | "elevation";
  args?: StoryArgs;
  children?: string;
  globals?: StoryGlobals;
  parameters?: StoryParameters;
}): Story {
  return {
    args,
    globals,
    parameters,
    render: storyArgs => (
      <MobileContentStack {...storyArgs}>
        <CardItemsList count={count} variant={variant}>
          {children}
        </CardItemsList>
      </MobileContentStack>
    ),
  };
}

export function createSingleChildStory(): Story {
  return {
    render: args => (
      <MobileContentStack {...args}>
        <CardItem index={1}>
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
}

export function createLocaleStory({
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
