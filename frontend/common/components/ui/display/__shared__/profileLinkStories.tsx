import type { StoryObj } from "@storybook/react";

export type ProfileLinkStoriesData = {
  readonly plainTextName: string;
  readonly withAvatarImageName: string;
  readonly withAvatarImageHref: string;
  readonly withAvatarImageUrl: string;
  readonly noAvatarName: string;
  readonly noAvatarHref: string;
  readonly fallbackHref: string;
  readonly arabicName: string;
  readonly arabicHref: string;
  readonly arabicLabel: string;
};

export function buildProfileLinkStories(config: ProfileLinkStoriesData): {
  readonly Linked: StoryObj;
  readonly PlainText: StoryObj;
  readonly WithAvatarImage: StoryObj;
  readonly NoAvatar: StoryObj;
  readonly WithFallbackInitial: StoryObj;
  readonly Arabic: StoryObj;
} {
  const Linked: StoryObj = {};

  const PlainText: StoryObj = {
    args: {
      href: undefined,
      name: config.plainTextName,
    },
  };

  const WithAvatarImage: StoryObj = {
    args: {
      name: config.withAvatarImageName,
      href: config.withAvatarImageHref,
      avatarUrl: config.withAvatarImageUrl,
    },
  };

  const NoAvatar: StoryObj = {
    args: {
      name: config.noAvatarName,
      href: config.noAvatarHref,
      showAvatar: false,
    },
  };

  const WithFallbackInitial: StoryObj = {
    args: {
      name: "",
      href: config.fallbackHref,
      fallbackInitial: "?",
    },
  };

  const Arabic: StoryObj = {
    globals: { locale: "ar" },
    args: {
      name: config.arabicName,
      href: config.arabicHref,
      label: config.arabicLabel,
    },
  };

  return { Linked, PlainText, WithAvatarImage, NoAvatar, WithFallbackInitial, Arabic };
}
