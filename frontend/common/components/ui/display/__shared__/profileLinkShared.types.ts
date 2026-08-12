import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";

export type ProfileLinkSharedProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  readonly typographyVariant?: UiTypographyVariantLoose;
  readonly fontWeight?: number;
  readonly emphasizeLink?: boolean;
};
