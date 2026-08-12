"use client";

import {
  getUserAvatarSx,
  type UserAvatarProps,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

export type { UserAvatarProps };

export function DesktopUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <DesktopBaseAvatar
      variant={variant}
      sx={[theme => getUserAvatarSx(theme, props.src), ...normalizedSx]}
      {...props}
    />
  );
}
