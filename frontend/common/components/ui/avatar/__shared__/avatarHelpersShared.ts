import type { Theme } from "@mui/material/styles";
import type {
  BaseAvatarProps,
  BaseAvatarVariant,
} from "@/frontend/common/components/ui/avatar/types/avatarShared.types";

export type UserAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarVariant;
};

export type ClassAvatarProps = Omit<BaseAvatarProps, "variant"> & {
  readonly variant?: BaseAvatarVariant;
};

/**
 * The fallback sx applied when an avatar has no image src.
 * Uses typography `labelMd` and bold font weight for the initials text.
 */
const FALLBACK_SX = {
  typography: "labelMd",
  fontWeight: 700,
} as const;

/**
 * Produces the sx callback for a user avatar based on whether a src is provided.
 * When src is present, applies a subtle border. Otherwise, applies container
 * colors and fallback typography for the initials.
 */
export function getUserAvatarSx(theme: Theme, src?: string | null) {
  if (src) {
    return { border: `1px solid ${theme.palette.border.light}` };
  }
  return {
    backgroundColor: theme.palette.primaryContainer,
    color: theme.palette.onPrimaryContainer,
    ...FALLBACK_SX,
  };
}

/**
 * Produces the sx callback for a class avatar based on whether a src is provided.
 * When src is present, no additional styling is needed. Otherwise, applies
 * secondary container colors and fallback typography for the initials.
 */
export function getClassFallbackSx(theme: Theme, src?: string | null) {
  if (src) {
    return {};
  }
  return {
    backgroundColor: theme.palette.secondaryContainer,
    color: theme.palette.onSecondaryContainer,
    ...FALLBACK_SX,
  };
}
