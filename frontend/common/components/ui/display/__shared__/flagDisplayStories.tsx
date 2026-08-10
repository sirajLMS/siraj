import { Box } from "@mui/material";
import type { Decorator, Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";

export type FlagDisplayProps = {
  readonly code?: string | null;
  readonly showEmoji?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
};

export type FlagDisplayStoriesConfig<TComponent extends ComponentType<FlagDisplayProps>> = {
  readonly title: string;
  readonly component: TComponent;
  readonly defaultCode: string;
  readonly unknownCode: string;
  readonly unknownFallback: string;
};

export type FlagDisplayStoriesData = {
  readonly defaultCode: string;
  readonly unknownCode: string;
  readonly unknownFallback: string;
};

const flagDecorator: Decorator = Story => (
  <Box sx={{ p: 2 }}>
    <Story />
  </Box>
);

export function buildFlagDisplayMeta<TComponent extends ComponentType<FlagDisplayProps>>(
  config: FlagDisplayStoriesConfig<TComponent>
): Meta<ComponentType<FlagDisplayProps>> {
  return {
    title: config.title,
    component: config.component,
    tags: ["ai-generated"],
    decorators: [flagDecorator],
  };
}

export function buildFlagDisplayStories(config: FlagDisplayStoriesData): {
  readonly Default: StoryObj;
  readonly EmojiOnly: StoryObj;
  readonly LabelOnly: StoryObj;
  readonly UnknownCode: StoryObj;
  readonly Arabic: StoryObj;
} {
  const Default: StoryObj = {
    args: { code: config.defaultCode },
  };

  const EmojiOnly: StoryObj = {
    args: { code: config.defaultCode, showLabel: false },
  };

  const LabelOnly: StoryObj = {
    args: { code: config.defaultCode, showEmoji: false },
  };

  const UnknownCode: StoryObj = {
    args: { code: config.unknownCode, fallback: config.unknownFallback },
  };

  const Arabic: StoryObj = {
    globals: { locale: "ar" },
    args: { code: config.defaultCode },
  };

  return { Default, EmojiOnly, LabelOnly, UnknownCode, Arabic };
}
