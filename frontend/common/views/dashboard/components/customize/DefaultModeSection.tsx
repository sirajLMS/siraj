"use client";

import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

/**
 * Default Mode section of the CustomizeSidebar.
 *
 * Sets the `defaultColorScheme` field of the appearance draft — the
 * color mode new visitors see on first load (design decision §2). This
 * is distinct from the per-mode editor's active tab (which governs
 * what the admin is previewing right now, not what users get by
 * default).
 *
 * Coerces the codegen-typed `defaultColorScheme: string` to a strict
 * `"light" | "dark"` for the radio's `value` — if the draft somehow
 * holds any other string, it falls back to `"dark"` (the
 * `DEFAULT_APPEARANCE_DRAFT` value).
 */
export function DefaultModeSection() {
  const defaultColorScheme = useAppearancePreviewStore(s => s.draft.defaultColorScheme);
  const setField = useAppearancePreviewStore(s => s.setField);

  const radioValue = defaultColorScheme === "light" ? "light" : "dark";

  return (
    <FormControl>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mui-palette-text-secondary)",
          mb: 1,
        }}
      >
        Default Mode
      </Typography>
      <RadioGroup row value={radioValue} onChange={e => setField("defaultColorScheme", e.target.value)}>
        <FormControlLabel value="light" control={<Radio size="small" />} label="Light" />
        <FormControlLabel value="dark" control={<Radio size="small" />} label="Dark" />
      </RadioGroup>
    </FormControl>
  );
}
