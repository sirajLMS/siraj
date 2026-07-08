import type { StoryObj } from "@storybook/react";
import { buildFlagDisplayMeta, buildFlagDisplayStories } from "./__shared__/flagDisplayStories";
import { CountryDisplay } from "./CountryDisplay";

const meta = buildFlagDisplayMeta({
  title: "UI/Display/CountryDisplay",
  component: CountryDisplay,
  defaultCode: "SA",
  unknownCode: "ZZ",
  unknownFallback: "Unknown country",
});

export default meta;
type Story = StoryObj<typeof CountryDisplay>;

const stories = buildFlagDisplayStories({
  defaultCode: "SA",
  unknownCode: "ZZ",
  unknownFallback: "Unknown country",
});

export const Default: Story = stories.Default;
export const EmojiOnly: Story = stories.EmojiOnly;
export const LabelOnly: Story = stories.LabelOnly;
export const UnknownCode: Story = stories.UnknownCode;
export const Arabic: Story = stories.Arabic;
