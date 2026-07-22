"use client";

import type { Theme } from "@mui/material/styles";
import type { UserAvatarProps } from "@/frontend/common/components/ui/avatar";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function DesktopUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : [sx].filter(Boolean);
  return (
    <DesktopBaseAvatar variant={variant} sx={[theme => getAvatarSx(theme, props.src), ...normalizedSx]} {...props} />
  );
}

function getAvatarSx(theme: Theme, src?: string | null) {
  if (src) {
    return { border: `1px solid ${theme.palette.border.light}` };
  }
  return {
    backgroundColor: theme.palette.primaryContainer,
    color: theme.palette.onPrimaryContainer,
    ...FALLBACK_SX,
  };
}
