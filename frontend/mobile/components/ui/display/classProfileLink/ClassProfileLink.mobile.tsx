"use client";

import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";
import { ProfileLinkBase } from "@/frontend/common/components/ui/display/__shared__/ProfileLinkBase";
import type { UiTypographyVariantLoose } from "@/frontend/common/types/shared.types";

export type MobileClassProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  /** Wider than `TypographyProps["variant"]` to admit custom theme variants like `bodySm`. */
  readonly typographyVariant?: UiTypographyVariantLoose;
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};

/**
 * Mobile-tier class profile link. Renders an inline-rounded ClassAvatar +
 * optional label + class name, linking only when `href` is provided.
 * Tighter spacing and smaller default avatar than desktop.
 * Consumes the shared `ProfileLinkBase` with mobile spacing defaults.
 */
export function MobileClassProfileLink({
  avatarSize = 24,
  typographyVariant = "bodyMd",
  ...props
}: MobileClassProfileLinkProps) {
  return (
    <ProfileLinkBase
      {...props}
      avatarSize={avatarSize}
      typographyVariant={typographyVariant}
      spacing={0.75}
      compact
      renderAvatar={({ src, name, fallbackInitial, size }) => (
        <ClassAvatar src={src} label={name || fallbackInitial} size={size}>
          {name ? null : fallbackInitial}
        </ClassAvatar>
      )}
    />
  );
}
