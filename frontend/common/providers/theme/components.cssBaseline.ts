import type { Components, Theme } from "@mui/material/styles";
import { AUTOFILL_BACKGROUND_VAR, AUTOFILL_TEXT_VAR } from "@/frontend/common/providers/theme/components.autofill";

type CssBaselineStyleOverrides = NonNullable<
  NonNullable<Components<Omit<Theme, "components">>["MuiCssBaseline"]>["styleOverrides"]
>;

/**
 * Baseline CSS rules applied globally: surface/data-display geometry, control
 * chrome, autofill theming, and scrollbar styling.
 *
 * Autofill rules use CSS variable references so the browser resolves the
 * correct colors at runtime for the active color scheme. Hardcoded literals
 * baked at theme creation time only matched the default scheme, causing
 * mismatched autofill styling when the user switched modes.
 */
const CSS_BASELINE_STYLE_OVERRIDES: CssBaselineStyleOverrides = {
  body: {
    backgroundColor: "var(--mui-palette-background-default)",
    color: "var(--mui-palette-onBackground)",
  },
  ".MuiCard-root": {
    borderRadius: "12px !important",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08) !important",
  },
  ".MuiDataGrid-root": {
    borderRadius: "12px !important",
    border: "1px solid var(--mui-palette-divider) !important",
    overflow: "hidden",
  },
  ".MuiDataGrid-columnHeader": {
    backgroundColor: "var(--mui-palette-surfaceContainer, var(--mui-palette-background-paper)) !important",
    borderBottom: "1px solid var(--mui-palette-divider) !important",
  },
  ".MuiDataGrid-row": {
    borderBottom: "1px solid var(--mui-palette-divider) !important",
    transition: "background-color 150ms ease !important",
    "&:hover": {
      backgroundColor: "var(--mui-palette-action-hover) !important",
    },
    "&.Mui-selected": {
      backgroundColor: "var(--mui-palette-action-selected) !important",
    },
  },
  ".MuiDataGrid-cell": {
    padding: "8px 10px !important",
  },
  ".MuiDialog-paper": {
    borderRadius: "12px !important",
  },
  ".MuiListItemButton-root": {
    borderRadius: "8px !important",
    minHeight: "44px !important",
  },
  ".MuiAppBar-root": {
    borderBottom: "1px solid var(--mui-palette-divider) !important",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08) !important",
  },
  ".MuiTabs-indicator": {
    borderRadius: "2px !important",
  },
  ".MuiTab-root": {
    minHeight: "48px !important",
    "&:hover": {
      color: "var(--mui-palette-primary-main) !important",
    },
  },
  ".MuiButton-root": {
    borderRadius: "8px !important",
    fontWeight: "700 !important",
  },
  ".MuiAlert-root": {
    borderRadius: "8px !important",
  },
  ".MuiSnackbar-root": {
    borderRadius: "8px !important",
  },
  ".MuiTooltip-tooltip": {
    borderRadius: "6px !important",
    fontSize: "0.75rem !important",
  },
  ".MuiSwitch-track": {
    borderRadius: "16px !important",
  },
  ".MuiSwitch-thumb": {
    borderRadius: "50% !important",
  },
  ".MuiCheckbox-root": {
    borderRadius: "4px !important",
  },
  ".MuiButton-root:focus-visible, .MuiIconButton-root:focus-visible": {
    outline: "2px solid var(--mui-palette-primary-main) !important",
    outlineOffset: "2px !important",
  },
  ".MuiMenu-paper, .MuiPopover-paper": {
    borderRadius: "12px !important",
    boxShadow: "0 4px 16px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.12) !important",
  },
  ".MuiMenuItem-root": {
    minHeight: "40px !important",
    "&:hover": {
      backgroundColor: "var(--mui-palette-action-hover) !important",
    },
  },
  ".MuiChip-root": {
    borderRadius: "8px !important",
  },
  ".MuiBadge-badge": {
    borderRadius: "8px !important",
  },
  ".MuiDialogTitle-root": {
    fontWeight: "600 !important",
  },
  ".MuiCheckbox-root .MuiSvgIcon-root": {
    borderRadius: "4px !important",
  },
  ".MuiSkeleton-root": {
    borderRadius: "8px !important",
  },
  "input:-webkit-autofill": {
    WebkitBoxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
    WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
    caretColor: `${AUTOFILL_TEXT_VAR} !important`,
    borderRadius: "inherit",
    transition: "background-color 5000s ease-in-out 0s",
  },
  "input:-webkit-autofill:hover": {
    WebkitBoxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
    WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
  },
  "input:-webkit-autofill:focus": {
    WebkitBoxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
    WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
  },
  "input:-webkit-autofill:active": {
    WebkitBoxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
    WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
  },
  "textarea:-webkit-autofill, select:-webkit-autofill": {
    WebkitBoxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
    WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
    caretColor: `${AUTOFILL_TEXT_VAR} !important`,
    borderRadius: "inherit",
    transition: "background-color 5000s ease-in-out 0s",
  },
  "input:autofill, textarea:autofill, select:autofill": {
    boxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
    color: `${AUTOFILL_TEXT_VAR} !important`,
  },
  "input:-internal-autofill-selected": {
    backgroundColor: `${AUTOFILL_BACKGROUND_VAR} !important`,
    backgroundImage: "none !important",
    color: `${AUTOFILL_TEXT_VAR} !important`,
  },
  "input[data-com-onepassword-filled], textarea[data-com-onepassword-filled], input[data-com-onepassword-filled='dark'], textarea[data-com-onepassword-filled='dark']":
    {
      backgroundColor: `${AUTOFILL_BACKGROUND_VAR} !important`,
      WebkitBoxShadow: `0 0 0 1000px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
      WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
      color: `${AUTOFILL_TEXT_VAR} !important`,
      caretColor: `${AUTOFILL_TEXT_VAR} !important`,
    },
  "*::-webkit-scrollbar": {
    width: "6px",
    backgroundColor: "transparent",
  },
  "*::-webkit-scrollbar-track": {
    background: "color-mix(in srgb, var(--mui-palette-onBackground) 2%, transparent)",
    borderRadius: "6px",
    margin: "4px 0",
  },
  "*::-webkit-scrollbar-thumb": {
    background: "color-mix(in srgb, var(--mui-palette-onBackground) 15%, transparent)",
    borderRadius: "6px",
    border: "2px solid var(--mui-palette-background-default)",
  },
  "*::-webkit-scrollbar-thumb:hover": {
    background: "color-mix(in srgb, var(--mui-palette-onBackground) 25%, transparent)",
  },
  "*": {
    scrollbarWidth: "thin",
    scrollbarColor:
      "color-mix(in srgb, var(--mui-palette-onBackground) 15%, transparent) color-mix(in srgb, var(--mui-palette-onBackground) 2%, transparent)",
  },
};

export const getMuiCssBaseline = (): Components<Omit<Theme, "components">>["MuiCssBaseline"] => ({
  styleOverrides: CSS_BASELINE_STYLE_OVERRIDES,
});
