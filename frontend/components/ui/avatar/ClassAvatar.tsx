"use client";

import type { Theme } from "@mui/material/styles";
import type { BaseAvatarProps } from "@/frontend/components/ui/avatar/BaseAvatar";
import { BaseAvatar } from "@/frontend/components/ui/avatar/BaseAvatar";

export type ClassAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function ClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : ([sx].filter(Boolean) as (typeof sx)[]);
  return <BaseAvatar variant={variant} sx={[theme => getFallbackSx(theme, props.src), ...normalizedSx]} {...props} />;
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
