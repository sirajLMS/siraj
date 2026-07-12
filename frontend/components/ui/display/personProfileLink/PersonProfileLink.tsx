"use client";

import type { TypographyProps } from "@mui/material/Typography";
import { UserAvatar } from "@/frontend/components/ui/avatar/UserAvatar";
import { ProfileLinkBase } from "@/frontend/components/ui/display/__shared__/ProfileLinkBase";

export type PersonProfileLinkProps = {
  readonly href?: string | null;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly avatarSize?: number;
  readonly fallbackInitial?: string;
  readonly label?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly fontWeight?: number;
  /** When true, use primary color for the name (linked look). Default true when href is set. */
  readonly emphasizeLink?: boolean;
};

/**
 * Name (optional avatar) that links to a profile/person page when `href` is provided.
 * Renders plain text when `href` is missing — never invents a destination.
 */
export function PersonProfileLink(props: PersonProfileLinkProps) {
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
