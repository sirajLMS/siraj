"use client";

import { Avatar } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { getAvatarContent, ROUNDED_BORDER_RADIUS } from "@/frontend/common/components/ui/avatar/avatarSharedUtils";
import type { BaseAvatarProps } from "@/frontend/common/components/ui/avatar/types/avatarShared.types";
import { avatarInitials } from "@/frontend/common/utils/avatar";

export function BaseAvatarScaffold({
  src,
  label = "",
  size = 40,
  variant = "circular",
  sx,
  children,
}: BaseAvatarProps) {
  const initials = children ?? avatarInitials(label);
  const normalizedSx = Array.isArray(sx) ? sx : ([sx].filter(Boolean) as SxProps<Theme>[]);
  const roundedStyle = variant === "rounded" ? { borderRadius: ROUNDED_BORDER_RADIUS } : {};
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
          flexShrink: 0,
          ...roundedStyle,
        },
        ...normalizedSx,
      ]}
    >
      {avatarContent}
    </Avatar>
  );
}
