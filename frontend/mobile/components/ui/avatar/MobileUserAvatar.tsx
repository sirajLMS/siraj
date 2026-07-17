"use client";

import type { Theme } from "@mui/material/styles";
import type { BaseAvatarProps } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";
import { MobileBaseAvatar } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";

export type UserAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function MobileUserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : ([sx].filter(Boolean) as (typeof sx)[]);
  return (
    <MobileBaseAvatar variant={variant} sx={[theme => getAvatarSx(theme, props.src), ...normalizedSx]} {...props} />
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
