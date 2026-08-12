"use client";

import {
  type ClassAvatarProps,
  getClassFallbackSx,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

export type { ClassAvatarProps };

export function DesktopClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <DesktopBaseAvatar
      variant={variant}
      sx={[theme => getClassFallbackSx(theme, props.src), ...normalizedSx]}
      {...props}
    />
  );
}
