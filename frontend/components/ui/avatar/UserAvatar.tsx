"use client";

import type { BaseAvatarProps } from "@/frontend/components/ui/avatar/BaseAvatar";
import { BaseAvatar } from "@/frontend/components/ui/avatar/BaseAvatar";

export type UserAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function UserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <BaseAvatar
      variant={variant}
      sx={[
        theme =>
          props.src
            ? { border: `1px solid ${theme.palette.border.light}` }
            : {
                backgroundColor: theme.palette.primaryContainer,
                color: theme.palette.onPrimaryContainer,
                ...FALLBACK_SX,
              },
        ...normalizedSx,
      ]}
      {...props}
    />
  );
}
