"use client";

import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { ProfileLinkBase } from "@/frontend/common/components/ui/display/__shared__/ProfileLinkBase";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type DesktopPersonProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  readonly typographyVariant?: UiTypographyVariant;
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};

/**
 * Desktop-tier person profile link. Renders an inline-circular UserAvatar +
 * optional label + person name, linking only when `href` is provided.
 * Consumes the shared `ProfileLinkBase` with desktop spacing defaults.
 */
export function DesktopPersonProfileLink(props: DesktopPersonProfileLinkProps) {
  return (
    <ProfileLinkBase
      {...props}
      renderAvatar={({ src, name, fallbackInitial, size }) => (
        <UserAvatar src={src} label={name || fallbackInitial} size={size}>
          {name ? null : fallbackInitial}
        </UserAvatar>
      )}
    />
  );
}
