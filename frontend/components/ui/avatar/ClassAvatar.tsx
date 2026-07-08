"use client";

import type { BaseAvatarProps } from "./BaseAvatar";
import { BaseAvatar } from "./BaseAvatar";

export type ClassAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarProps["variant"];
};

export function ClassAvatar({ variant = "rounded", sx, ...props }: ClassAvatarProps) {
  return (
    <BaseAvatar
      variant={variant}
      sx={[
        theme => ({
          ...(!props.src
            ? {
                backgroundColor: theme.palette.secondaryContainer,
                color: theme.palette.onSecondaryContainer,
                typography: "labelMd",
                fontWeight: 700,
              }
            : {}),
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
