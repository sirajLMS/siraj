// NEW FOR PLAN v5 (newly created for the migration wave)
import { alpha, type Theme } from "@mui/material/styles";

/**
 * Override button color variant. Lifted from the tier-side
 * `overrideEditControls.{mobile,desktop}.tsx` files (NS-3 — N9 lift) so the
 * twin tier files no longer declare a duplicate `OverrideColorVariant`.
 *
 * Kept here (in utils, not types) because it is a tightly-coupled rendering
 * concern of {@link getOverrideVariantColors} — moving it to `types/` would
 * orphan the variant from the pure-data helper that consumes it.
 */
export type OverrideColorVariant = "inherit" | "allow" | "deny";

/**
 * Returns the active-state background + foreground palette pair for a given
 * override button color variant. Lifted verbatim from the byte-identical
 * `getVariantColors` helper that previously lived inline in BOTH tier files
 * (specs §5 byte-identical twin modules, §3 N9 — lowercase pure-data
 * helpers live in common utils).
 *
 * Pure-data: takes `theme` as a parameter (does NOT call `useTheme()`), so it
 * remains safe to call from styled-component factories in tier files.
 */
export function getOverrideVariantColors(variant: OverrideColorVariant, theme: Theme) {
  if (variant === "inherit") {
    return { bg: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer };
  }
  if (variant === "allow") {
    return {
      bg: theme.palette.successContainer ?? alpha(theme.palette.success.main, 0.15),
      color: theme.palette.success.main,
    };
  }
  return {
    bg: theme.palette.errorContainer ?? alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.main,
  };
}
