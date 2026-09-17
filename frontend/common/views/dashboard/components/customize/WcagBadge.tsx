"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { contrastRatio, pickOnPrimary, wcagGrade } from "@/shared/lib/color-contrast.utils";

/**
 * Props for {@link WcagBadge}.
 */
export interface WcagBadgeProps {
  /** Brand color (`#RRGGBB`) whose contrast is being graded. */
  readonly hex: string;
}

/**
 * WCAG compliance badge for the site-appearance customizer (Task 9.6, AC-32).
 *
 * Renders a compact pill showing the WCAG grade (`AAA` / `AA` / `AA Large` /
 * `Fail`) plus the numeric contrast ratio (e.g. `4.54:1`) for the admin's
 * chosen `hex` brand color. The ratio is computed against the **dynamically
 * derived `onPrimary`** (the foreground color that would be used on top of
 * `hex` for text labels) — i.e. the actual contrast the user will see on
 * primary-colored buttons/chips in production.
 *
 * `pickOnPrimary` returns `#ffffff` or `#000000` based on whichever has the
 * higher WCAG 2.1 contrast ratio against `hex` (this is the same derivation
 * used by `useAppearanceCssVars` to write `--mui-palette-onPrimary`). The
 * badge therefore reflects the **real** on-primary contrast, not a generic
 * white-on-color measurement.
 *
 * Visual:
 *  - `AAA` / `AA` / `AA Large` → success-tinted pill (semantic MUI palette
 *    tokens, no hardcoded colors per `frontend/AGENTS.md`).
 *  - `Fail` → error-tinted pill.
 *  - The numeric ratio is shown in `text-secondary` next to the pill.
 *
 * Rendering is intentionally pure — same `hex` always yields the same badge,
 * with no internal state, so the parent `ColorField` can remount it on hex
 * change (via its `key` prop) without any effect-sync overhead.
 */
export function WcagBadge({ hex }: WcagBadgeProps) {
  const onPrimary = pickOnPrimary(hex);
  const ratio = contrastRatio(hex, onPrimary);
  const grade = wcagGrade(ratio);
  const isFail = grade === "Fail";

  // Semantic MUI palette tokens (per `frontend/AGENTS.md` "NO hardcoded
  // colors" rule). `onSuccess` / `onError` are the Material 3 contrast
  // siblings — same convention the rest of the dashboard uses for chip text.
  const pillBg = (theme: Theme) => (isFail ? theme.palette.error.main : theme.palette.success.main);
  const pillFg = (theme: Theme) => (isFail ? theme.palette.onError : theme.palette.onSuccess);

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box
        component="span"
        aria-label={`WCAG ${grade}`}
        sx={theme => ({
          display: "inline-flex",
          alignItems: "center",
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
          backgroundColor: pillBg(theme),
          color: pillFg(theme),
          fontSize: theme.typography.labelSm.fontSize,
          fontWeight: 700,
          lineHeight: 1.4,
          letterSpacing: "0.02em",
          minWidth: 22,
          justifyContent: "center",
        })}
      >
        {grade}
      </Box>
      <Typography variant="caption" sx={theme => ({ fontFamily: "monospace", color: theme.palette.text.secondary })}>
        {ratio.toFixed(2)}:1
      </Typography>
    </Stack>
  );
}
