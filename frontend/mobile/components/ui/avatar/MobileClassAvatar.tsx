"use client";

import {
  type ClassAvatarProps,
  getClassFallbackSx,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { MobileBaseAvatar } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";

export type { ClassAvatarProps };

export function MobileClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <MobileBaseAvatar
      variant={variant}
      sx={[theme => getClassFallbackSx(theme, props.src), ...normalizedSx]}
      {...props}
    />
  );
}
