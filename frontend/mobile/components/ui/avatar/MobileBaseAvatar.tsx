"use client";

import { Avatar } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { avatarInitials } from "@/frontend/common/utils/avatar";

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

export function MobileBaseAvatar({ src, label = "", size = 36, variant = "circular", sx, children }: BaseAvatarProps) {
  const initials = children ?? avatarInitials(label);
  const normalizedSx = Array.isArray(sx) ? sx : ([sx].filter(Boolean) as SxProps<Theme>[]);
  const roundedStyle = variant === "rounded" ? { borderRadius: ROUNDED_BORDER_RADIUS } : {};
  const circularOutlineSx: SxProps<Theme> =
    variant === "circular" ? theme => ({ outline: `1px solid ${theme.palette.divider}` }) : [];
  const avatarContent = getAvatarContent(src, initials);

  return (
    <Avatar
      src={src ?? undefined}
      alt={label || undefined}
      variant={variant}
      sx={[
        {
          width: size,
          height: size,
          ...roundedStyle,
        },
        circularOutlineSx,
        ...normalizedSx,
      ]}
    >
      {avatarContent}
    </Avatar>
  );
}

function getAvatarContent(src: string | null | undefined, initials: ReactNode) {
  if (src) {
    return null;
  }
  return initials;
}
