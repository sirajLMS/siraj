"use client";

import {
  getUserAvatarSx,
  type UserAvatarProps,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { MobileBaseAvatar } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";

export type { UserAvatarProps };

function normalizeSx(sx: UserAvatarProps["sx"]) {
  if (Array.isArray(sx)) {
    return sx;
  }
  return sx ? [sx] : [];
}

export function MobileUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = normalizeSx(sx);
  return (
    <MobileBaseAvatar variant={variant} sx={[theme => getUserAvatarSx(theme, props.src), ...normalizedSx]} {...props} />
  );
}
