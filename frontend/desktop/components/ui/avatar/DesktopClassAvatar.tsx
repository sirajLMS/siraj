"use client";

import type { Theme } from "@mui/material/styles";
import type { BaseAvatarProps, BaseAvatarVariant } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

export type ClassAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarVariant;
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function DesktopClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : [sx].filter(Boolean);
  return (
    <DesktopBaseAvatar variant={variant} sx={[theme => getFallbackSx(theme, props.src), ...normalizedSx]} {...props} />
  );
}

function getFallbackSx(theme: Theme, src?: string | null) {
  if (src) {
    return {};
  }
  return {
    backgroundColor: theme.palette.secondaryContainer,
    color: theme.palette.onSecondaryContainer,
    ...FALLBACK_SX,
  };
}
