"use client";

import {
  getUserAvatarSx,
  type UserAvatarProps,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { MobileBaseAvatar } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";

export type { UserAvatarProps };

export function MobileUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <MobileBaseAvatar variant={variant} sx={[theme => getUserAvatarSx(theme, props.src), ...normalizedSx]} {...props} />
  );
}
