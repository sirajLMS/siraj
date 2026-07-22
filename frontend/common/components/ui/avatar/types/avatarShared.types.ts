import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

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
