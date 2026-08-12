"use client";

import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { ProfileLinkBase } from "@/frontend/common/components/ui/display/__shared__/ProfileLinkBase";
import type { PersonProfileLinkProps } from "@/frontend/common/components/ui/display/personProfileLink/types/personProfileLink.types";

export type { PersonProfileLinkProps };

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
