"use client";

import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";
import { ProfileLinkBase } from "@/frontend/common/components/ui/display/__shared__/ProfileLinkBase";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";

export type DesktopClassProfileLinkProps = {
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
 * Desktop-tier class profile link. Renders an inline-rounded ClassAvatar +
 * optional label + class name, linking only when `href` is provided.
 * Consumes the shared `ProfileLinkBase` with desktop spacing defaults.
 */
export function DesktopClassProfileLink(props: DesktopClassProfileLinkProps) {
  return (
    <ProfileLinkBase
      {...props}
      renderAvatar={({ src, name, fallbackInitial, size }) => (
        <ClassAvatar src={src} label={name || fallbackInitial} size={size}>
          {name ? null : fallbackInitial}
        </ClassAvatar>
      )}
    />
  );
}
