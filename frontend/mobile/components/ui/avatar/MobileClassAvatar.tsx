"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import {
  type ClassAvatarProps,
  getClassFallbackSx,
} from "@/frontend/common/components/ui/avatar/__shared__/avatarHelpersShared";
import { MobileBaseAvatar } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";

export type { ClassAvatarProps };

function normalizeSx(sx: SxProps<Theme> | undefined) {
  if (sx) {
    return Array.isArray(sx) ? sx : [sx];
  }
  return [];
}

export function MobileClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  const normalizedSx = normalizeSx(sx);
  return (
    <MobileBaseAvatar
      variant={variant}
      sx={[theme => getClassFallbackSx(theme, props.src), ...normalizedSx]}
      {...props}
    />
  );
}
