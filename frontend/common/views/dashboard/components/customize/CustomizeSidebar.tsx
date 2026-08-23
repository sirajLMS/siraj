"use client";

import { Box } from "@mui/material";
import { BrandIdentitySection } from "@/frontend/common/views/dashboard/components/customize/BrandIdentitySection";
import { ColorEditorSection } from "@/frontend/common/views/dashboard/components/customize/ColorEditorSection";
import { DefaultModeSection } from "@/frontend/common/views/dashboard/components/customize/DefaultModeSection";
import { LogoUploadSection } from "@/frontend/common/views/dashboard/components/customize/LogoUploadSection";
import { PresetThemeSection } from "@/frontend/common/views/dashboard/components/customize/PresetThemeSection";

/**
 * CustomizeSidebar — site-appearance customizer overlay sidebar.
 *
 * Renders 5 stacked sections (Brand Identity, Logo, Preset Themes, Theme
 * Colors, Default Mode) per `.ai/plans/brand/prototype/customize-overlay.html`
 * §2. All edits write through `useAppearancePreviewStore` for live
 * preview:
 *
 * - `setField(siteName | siteTitle | siteDescription | logoUrl |
 *   defaultColorScheme)` for scalar draft fields.
 * - `setModeColors(mode, pair)` for per-mode primary/secondary hex.
 * - `setMode(isDark)` to switch the active mode tab AND the live app
 *   color mode (design decision §12).
 *
 * Task 6.1 mounts this as a 300px in-flow flex item to the LEFT of the
 * dashboard shell on desktop (md+); hidden on mobile
 * (`display: { xs: "none", md: "flex" }`). The shell, mounting, and
 * sidebar-collapse behavior are all owned by Task 6.1 — this component
 * only owns the editor controls.
 *
 * Sub-components are split into sibling files (BrandIdentitySection,
 * LogoUploadSection, PresetThemeSection, ColorEditorSection,
 * DefaultModeSection) to stay under the CodeScene 150-line file-size
 * guideline and to keep each editor's effect surface small (each
 * subscribes only to the slice of the store it edits).
 *
 * Preset Themes (Task 9.4) is placed between Logo and Theme Colors so
 * admins pick a starting palette before fine-tuning individual colors.
 */
export function CustomizeSidebar() {
  return (
    <Box
      component="aside"
      aria-label="Customize mode sidebar"
      sx={{
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: 300,
        flexShrink: 0,
        overflowY: "auto",
        backgroundColor: "var(--mui-palette-background-paper)",
        color: "var(--mui-palette-onSurface)",
        borderInlineEnd: "1px solid var(--mui-palette-outlineVariant)",
        p: 2,
        gap: 3,
      }}
    >
      <BrandIdentitySection />
      <LogoUploadSection />
      <PresetThemeSection />
      <ColorEditorSection />
      <DefaultModeSection />
    </Box>
  );
}
