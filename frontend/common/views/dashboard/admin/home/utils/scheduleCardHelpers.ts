// NEW FOR PLAN v5: schedule card pure-data helper (getPersonAccentColor) lifted out of the mobile tier view so
// tier modules contain rendering only.
import type { Theme } from "@mui/material/styles";

export type PersonAccentTone = "teacher" | "student" | "default";

export function getPersonAccentColor(tone: PersonAccentTone, theme: Theme): string {
  switch (tone) {
    case "teacher":
      return theme.palette.text.secondary;
    case "student":
      return theme.palette.onSurface;
    case "default":
      return theme.palette.onSurface;
  }
  throw new Error(`Unhandled case in getPersonAccentColor`);
}
