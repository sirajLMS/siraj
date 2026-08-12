"use client";

import { Avatar } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { getAvatarContent, ROUNDED_BORDER_RADIUS } from "@/frontend/common/components/ui/avatar/avatarSharedUtils";
import type { BaseAvatarProps } from "@/frontend/common/components/ui/avatar/types/avatarShared.types";
import { avatarInitials } from "@/frontend/common/utils/avatar";

/** Type guard that removes falsy sx values, narrowing to SxProps<Theme>. */
function isSxProps(value: SxProps<Theme> | undefined | null | false): value is SxProps<Theme> {
  return Boolean(value);
}

export interface BaseAvatarScaffoldOptions {
  /** Default avatar pixel size when the `size` prop is not explicitly passed. */
  readonly defaultSize?: number;
  /** When true, circular avatars receive a 1px divider outline (mobile tier). */
  readonly showCircularOutline?: boolean;
}

const DEFAULT_DESKTOP_OPTIONS: BaseAvatarScaffoldOptions = { defaultSize: 40, showCircularOutline: false };
const DEFAULT_MOBILE_OPTIONS: BaseAvatarScaffoldOptions = { defaultSize: 36, showCircularOutline: true };

export function BaseAvatarScaffold({
  src,
  label = "",
  size,
  variant = "circular",
  sx,
  children,
  options = DEFAULT_DESKTOP_OPTIONS,
}: BaseAvatarProps & { readonly options?: BaseAvatarScaffoldOptions }) {
  const effectiveSize = size ?? options.defaultSize ?? 40;
  const initials = children ?? avatarInitials(label);
  const normalizedSx = Array.isArray(sx) ? sx : [sx].filter(isSxProps);
  const roundedStyle = variant === "rounded" ? { borderRadius: ROUNDED_BORDER_RADIUS } : {};
  const circularOutlineSx: SxProps<Theme> =
    variant === "circular" && options.showCircularOutline
      ? theme => ({ outline: `1px solid ${theme.palette.divider}` })
      : [];
  const avatarContent = getAvatarContent(src, initials);

  return (
    <Avatar
      src={src ?? undefined}
      alt={label || undefined}
      variant={variant}
      sx={[
        {
          width: effectiveSize,
          height: effectiveSize,
          flexShrink: 0,
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

export { DEFAULT_DESKTOP_OPTIONS as DESKTOP_AVATAR_OPTIONS, DEFAULT_MOBILE_OPTIONS as MOBILE_AVATAR_OPTIONS };
