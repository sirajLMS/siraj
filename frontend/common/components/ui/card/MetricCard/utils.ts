import type { Theme } from "@mui/material";

export type MetricCardVariant = "default" | "error" | "highlight" | "danger";
export type MetricCardDensity = "default" | "compact";

export function formatValue(value: number | string): string {
  if (typeof value === "number") {
    return String(value);
  }
  return value;
}

export function valueColor({ variant, theme }: { variant: MetricCardVariant; theme: Theme }) {
  switch (variant) {
    case "error":
      // `theme.vars.*` so the customize overlay (`?customize=1`) live-updates
      // the metric value color when the admin picks a different preset.
      return theme.vars.palette.error.main;
    case "highlight":
      // emphasis comes from the card chrome (glow border + filled icon); a
      // lighter value color only reads as dimmer/disabled next to siblings
      return theme.vars.palette.primary.main;
    case "danger":
      return theme.vars.palette.error.main;
    case "default":
      return theme.vars.palette.primary.main;
  }
  throw new Error("Unhandled variant in valueColor");
}

export function filledIconWrapSx(theme: Theme, isError: boolean) {
  return {
    // `theme.vars.*` so the customize overlay live-updates the icon chip.
    backgroundColor: isError ? theme.vars.palette.error.main : theme.vars.palette.primary.main,
    borderColor: isError ? theme.vars.palette.error.main : theme.vars.palette.primary.main,
    "& .MuiSvgIcon-root": { color: isError ? theme.vars.palette.onError : theme.vars.palette.onPrimary },
  };
}

/**
 * Soft tinted background for the icon wrap in its default (non-highlight,
 * non-error) state — gives the icon a subtle colored "chip" appearance instead
 * of a bare bordered circle. Uses alpha() so it adapts to light/dark themes.
 * The chip color is read via `theme.vars.palette.*.mainChannel` so the
 * customize overlay (`?customize=1`) live-updates the tint when the admin
 * picks a different preset.
 */
export function tintedIconWrapSx(theme: Theme, isError: boolean) {
  if (isError) {
    return {
      // Use the CSS-var reference so the customize overlay live-updates the
      // icon chip tint. `alpha()` can't parse `var(...)`, so compose alpha
      // at the CSS layer via the MUI-generated `*Channel` var (space-separated
      // RGB channels) instead. String concatenation (not a template literal)
      // keeps the literal `var(` token visible to the `no-hardcoded-colors`
      // lint rule, which recognizes the `rgb(var(...) / alpha)` pattern.
      backgroundColor: "rgb(" + theme.vars.palette.error.mainChannel + " / 0.12)",
    };
  }
  return {
    backgroundColor: "rgb(" + theme.vars.palette.primary.mainChannel + " / 0.1)",
  };
}

function interactiveIconHoverSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(1.1)",
  };
}

function interactiveIconActiveSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(0.95)",
  };
}

/**
 * Shared visual-feedback styles for the MetricCard chrome: hover ring, highlight,
 * error border, icon wrap hover/active emphasis, and border radius. Used by both
 * the common (horizontal row) and mobile (compact column) StyledCard variants to
 * avoid duplicating these blocks across tiers.
 *
 * Enhancements: subtle lift on hover (translateY) + a gradient ring glow on the
 * highlight state + a faint red background tint for error cards so alert status
 * is scannable at a glance + a stronger primary-tinted hover glow.
 */
export function cardFeedbackSx(theme: Theme, isHighlight: boolean, isError: boolean) {
  // `theme.vars.*` so the customize overlay (`?customize=1`) live-updates the
  // hover/highlight/error chrome when the admin picks a different preset —
  // otherwise the hex would bake at SSR and freeze on the current preset
  // while the rest of the page re-themes.
  // `alpha()` cannot parse `var(...)` strings, so compose the rgba at the CSS
  // layer via MUI's generated `*Channel` vars (space-separated RGB).
  // String concatenation (not template literals) keeps the literal `var(`
  // substring visible to the `no-hardcoded-colors` lint rule, which
  // recognizes the `rgb(var(...) / alpha)` pattern.
  const tintChannel = theme.vars.palette.text.primaryChannel;
  const primaryChannel = theme.vars.palette.primary.mainChannel;
  const errorChannel = theme.vars.palette.error.mainChannel;
  const accentAlpha = isError ? 0 : 0.12;
  const shadowRest =
    "0 2px 4px rgb(" + tintChannel + " / 0.1), 0 8px 24px rgb(" + primaryChannel + " / " + accentAlpha + ")";
  const shadowHover =
    "0 6px 12px rgb(" +
    tintChannel +
    " / 0.14), 0 16px 36px rgb(" +
    (isError ? errorChannel : primaryChannel) +
    " / 0.26)";
  const shadowHighlight = "0 0 0 3px rgb(" + primaryChannel + " / 0.18), 0 8px 20px rgb(" + primaryChannel + " / 0.18)";
  const errorTint = "rgb(" + errorChannel + " / 0.06)";
  const primaryBorder = theme.vars.palette.primary.main;
  const errorBorder = theme.vars.palette.error.main;
  const errorBorderLight = theme.vars.palette.error.light;
  const actionHover = theme.vars.palette.action.hover;
  return {
    boxShadow: shadowRest,
    "&:hover": {
      borderColor: isError ? errorBorder : primaryBorder,
      boxShadow: shadowHover,
      transform: "translateY(-2px)",
    },
    ...(isHighlight && {
      borderColor: primaryBorder,
      backgroundColor: actionHover,
      boxShadow: shadowHighlight,
    }),
    ...(isError && {
      borderColor: errorBorderLight,
      // Faint red background tint so alert cards (Suspended/Absent) are
      // scannable at a glance without being aggressive.
      backgroundColor: errorTint,
    }),
    "&:hover .metric-icon-wrap": interactiveIconHoverSx(theme, isError),
    "&:active .metric-icon-wrap": interactiveIconActiveSx(theme, isError),
    borderRadius: 12,
  };
}
