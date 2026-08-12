"use client";

import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";
import { ProfileLinkBase } from "@/frontend/common/components/ui/display/__shared__/ProfileLinkBase";
import type { ClassProfileLinkProps } from "@/frontend/common/components/ui/display/classProfileLink/types/classProfileLink.types";

export type { ClassProfileLinkProps };

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
