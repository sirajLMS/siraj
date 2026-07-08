import type { StoryObj } from "@storybook/react";
import { buildFlagDisplayMeta, buildFlagDisplayStories } from "./__shared__/flagDisplayStories";
import { LanguageDisplay } from "./LanguageDisplay";

const meta = buildFlagDisplayMeta({
  title: "UI/Display/LanguageDisplay",
  component: LanguageDisplay,
  defaultCode: "ar",
  unknownCode: "xx",
  unknownFallback: "Unknown language",
});

export default meta;
type Story = StoryObj<typeof LanguageDisplay>;

const stories = buildFlagDisplayStories({
  defaultCode: "ar",
  unknownCode: "xx",
  unknownFallback: "Unknown language",
});

export const Default: Story = stories.Default;
export const EmojiOnly: Story = stories.EmojiOnly;
export const LabelOnly: Story = stories.LabelOnly;
export const UnknownCode: Story = stories.UnknownCode;
export const Arabic: Story = stories.Arabic;
