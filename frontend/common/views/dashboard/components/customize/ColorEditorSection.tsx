"use client";

import { Box, type PaletteMode, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import type { AppearanceColorPairInput, AppearanceColorsInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { WcagBadge } from "@/frontend/common/views/dashboard/components/customize/WcagBadge";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Per-mode color key ("primary" | "secondary" via the codegen pair shape).
 */
type ColorKey = keyof AppearanceColorPairInput;

/**
 * Per-mode color key ("light" | "dark"). Matches `keyof AppearanceColorsInput`
 * from the codegen input types so the component never redefines the union.
 */
type AppearanceMode = keyof AppearanceColorsInput;

/**
 * Strict hex pattern enforced by the backend Zod schema (decision §22) and
 * mirrored by the prototype's `updateColor` guard. Partial input (e.g. `#2`)
 * is shown in the text field but NOT committed to the draft until it matches.
 */
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Theme Colors section of the CustomizeSidebar.
 *
 * Renders a Light/Dark `ToggleButtonGroup` that doubles as the live app
 * color-mode switch (design decision §12): selecting "Dark" calls
 * `setMode(true)` which writes the dark-mode brand CSS vars on `<html>`
 * via `writeActiveModeCssVars`. The active mode's primary/secondary
 * colors then become editable through a native color picker + hex text
 * field; edits to the active mode apply live to the dashboard.
 *
 * Inactive-mode edits persist to the draft (via `setModeColors`) but
 * don't write CSS vars until the admin switches tabs. The store's
 * `setModeColors` handles the `writeActiveModeCssVars` call, so this
 * component only needs to compose the next `{ primaryMain, secondaryMain }`
 * pair and dispatch.
 */
/**
 * Direct DOM sync for the MUI color-scheme attributes. Acts as a fallback
 * when useColorScheme().setMode is undefined (first render before CssVarsProvider
 * hydrates) or when the ColorSchemeStateBridge useLayoutEffect does not re-fire.
 * Ensures data-mui-color-scheme + colorScheme CSS property match the active
 * customizer tab so the MUI stylesheet repaints in the correct mode (AC-13).
 */
function syncColorSchemeDom(mode: PaletteMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.muiColorScheme = mode;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

export function ColorEditorSection() {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance.customize;
  const isDark = useAppearancePreviewStore(s => s.isDark);
  const colors = useAppearancePreviewStore(s => s.draft.colors);
  const setMode = useAppearancePreviewStore(s => s.setMode);
  const setModeColors = useAppearancePreviewStore(s => s.setModeColors);
  const { setMode: setMuiColorScheme } = useColorScheme();

  const activeMode: AppearanceMode = isDark ? "dark" : "light";
  const activePair = colors[activeMode];

  const updateColor = (key: ColorKey, hex: string): void => {
    const next: AppearanceColorPairInput = { ...activePair, [key]: hex };
    setModeColors(activeMode, next);
  };

  const handleTabChange = (_e: unknown, value: PaletteMode | null): void => {
    if (value === "dark") {
      setMode(true);
      setMuiColorScheme("dark");
      syncColorSchemeDom("dark");
    }
    if (value === "light") {
      setMode(false);
      setMuiColorScheme("light");
      syncColorSchemeDom("light");
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mui-palette-text-secondary)",
        }}
      >
        Theme Colors
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={isDark ? "dark" : "light"}
        onChange={handleTabChange}
        sx={{ width: "100%" }}
      >
        <ToggleButton value="light" sx={{ flex: 1 }}>
          Light
        </ToggleButton>
        <ToggleButton value="dark" sx={{ flex: 1 }}>
          Dark
        </ToggleButton>
      </ToggleButtonGroup>
      <ColorField
        key={`primary-${activePair.primaryMain}`}
        label={t.primaryColor}
        hex={activePair.primaryMain}
        onChange={hex => updateColor("primaryMain", hex)}
      />
      <ColorField
        key={`secondary-${activePair.secondaryMain}`}
        label={t.secondaryColor}
        hex={activePair.secondaryMain}
        onChange={hex => updateColor("secondaryMain", hex)}
      />
    </Stack>
  );
}

interface ColorFieldProps {
  readonly label: string;
  readonly hex: string;
  readonly onChange: (hex: string) => void;
}

/**
 * Color picker + hex text field combo.
 *
 * Local `text` state initializes from the `hex` prop and is remounted
 * (via the parent's `key` prop) whenever the upstream draft's hex
 * changes — so external updates (color picker, undo/redo, tab switch)
 * propagate without an effect, satisfying the
 * `react-hooks/set-state-in-effect` lint.
 *
 * The user can type partial hex values freely; only valid `#RRGGBB`
 * strings are committed upstream (matches the prototype's `updateColor`
 * regex guard).
 *
 * The swatch background uses the raw hex value (user-supplied brand
 * color data — NOT a theme palette token), so the "no hardcoded colors"
 * rule in `frontend/AGENTS.md` does not apply here. The rule governs UI
 * chrome tokens, not dynamic brand-color previews.
 */
export function ColorField({ label, hex, onChange }: ColorFieldProps) {
  const safeHex = HEX_PATTERN.test(hex) ? hex : "#000000";

  const handleTextChange = (value: string): void => {
    if (HEX_PATTERN.test(value)) {
      onChange(value);
    }
  };

  return (
    <Stack sx={{ gap: 1 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
          {label}
        </Typography>
        {HEX_PATTERN.test(safeHex) && <WcagBadge hex={safeHex} />}
      </Stack>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="label"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            border: "2px solid var(--mui-palette-outlineVariant)",
            backgroundColor: safeHex,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={safeHex}
            onChange={e => onChange(e.target.value)}
            style={{
              opacity: 0,
              width: "100%",
              height: "100%",
              cursor: "pointer",
              border: "none",
            }}
          />
        </Box>
        <TextField
          size="small"
          defaultValue={hex}
          onChange={e => handleTextChange(e.target.value)}
          sx={{ flex: 1, fontFamily: "monospace" }}
        />
      </Box>
    </Stack>
  );
}
