"use client";

import type { BaseAvatarProps } from "./BaseAvatar";
import { BaseAvatar } from "./BaseAvatar";

export type UserAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

export function UserAvatar({ variant = "circular", sx, ...props }: UserAvatarProps) {
  return (
    <BaseAvatar
      variant={variant}
      sx={[
        theme => ({
          ...(!props.src
            ? {
                backgroundColor: theme.palette.primaryContainer,
                color: theme.palette.onPrimaryContainer,
                typography: "labelMd",
                fontWeight: 700,
              }
            : {
                border: `1px solid ${theme.palette.border.light}`,
              }),
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
