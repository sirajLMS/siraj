"use client";

import type { BaseAvatarProps } from "./BaseAvatar";
import { BaseAvatar } from "./BaseAvatar";

export type ClassAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

export function ClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  const normalizedSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  return (
    <BaseAvatar
      variant={variant}
      sx={[
        theme =>
          props.src
            ? {}
            : {
                backgroundColor: theme.palette.secondaryContainer,
                color: theme.palette.onSecondaryContainer,
                ...FALLBACK_SX,
              },
        ...normalizedSx,
      ]}
      {...props}
    />
  );
}
