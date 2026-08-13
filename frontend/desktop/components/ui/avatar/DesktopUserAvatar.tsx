"use client";

import {
  getUserAvatarSx,
  type UserAvatarProps,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

export type { UserAvatarProps };

function normalizeSx(sx: UserAvatarProps["sx"]) {
  if (Array.isArray(sx)) {
    return sx;
  }
  return sx ? [sx] : [];
}

export function DesktopUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = normalizeSx(sx);
  return (
    <DesktopBaseAvatar
      variant={variant}
      sx={[theme => getUserAvatarSx(theme, props.src), ...normalizedSx]}
      {...props}
    />
  );
}
