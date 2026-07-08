"use client";

import { Avatar } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { avatarInitials } from "@/frontend/utils/avatar";

export type BaseAvatarVariant = "circular" | "rounded";

export type BaseAvatarProps = {
  readonly src?: string | null;
  /** Used for alt text and initials fallback when no image. */
  readonly label?: string;
  readonly size?: number;
  readonly variant?: BaseAvatarVariant;
  readonly sx?: SxProps<Theme>;
  readonly children?: ReactNode;
};

const ROUNDED_BORDER_RADIUS = 1.5;

export function BaseAvatar({
  src,
  label = "",
  size = 40,
  variant = "circular",
  sx,
  children,
}: BaseAvatarProps) {
  const hasImage = Boolean(src);
  const initials = children ?? (label ? avatarInitials(label) : "");

  return (
    <Avatar
      src={src ?? undefined}
      alt={label || undefined}
      variant={variant}
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
          ...(variant === "rounded" ? { borderRadius: ROUNDED_BORDER_RADIUS } : {}),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {!hasImage ? initials : null}
    </Avatar>
  );
}
