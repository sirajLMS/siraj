"use client";

import type { TypographyProps } from "@mui/material/Typography";
import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";
import { ProfileLinkBase } from "@/frontend/common/components/ui/display/__shared__/ProfileLinkBase";

export type ClassProfileLinkProps = {
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
 * Class name (optional avatar) that links to a class details page when `href` is provided.
 * Renders plain text when `href` is missing — never invents a destination.
 */
export function ClassProfileLink(props: ClassProfileLinkProps) {
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
