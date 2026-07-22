import type { ReactNode } from "react";

export const ROUNDED_BORDER_RADIUS = 1.5;

export function getAvatarContent(src: string | null | undefined, initials: ReactNode) {
  if (src) {
    return null;
  }
  return initials;
}
