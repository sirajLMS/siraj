"use client";

import type { Theme } from "@mui/material/styles";
import type { BaseAvatarProps } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

export type UserAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function DesktopUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : ([sx].filter(Boolean) as (typeof sx)[]);
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
