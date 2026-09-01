"use client";

import { Box } from "@mui/material";
import { BrandIdentitySection } from "@/frontend/common/views/dashboard/components/customize/BrandIdentitySection";
import { ColorEditorSection } from "@/frontend/common/views/dashboard/components/customize/ColorEditorSection";
import { DefaultModeSection } from "@/frontend/common/views/dashboard/components/customize/DefaultModeSection";
import { LogoUploadSection } from "@/frontend/common/views/dashboard/components/customize/LogoUploadSection";
import { PresetThemeSection } from "@/frontend/common/views/dashboard/components/customize/PresetThemeSection";

/**
 * Width of the desktop customize sidebar. The desktop dashboard layout
 * insets the fixed navbar by this amount while customize mode is active
 * so the sidebar and the navbar never overlap.
 */
export const CUSTOMIZE_SIDEBAR_WIDTH = 300;

/**
 * Desktop sidebar for the site-appearance customizer overlay.
 *
 * Renders the editor sections (Brand Identity, Logo Upload, Preset
 * Themes, Theme Colors, Default Mode) as a fixed-width in-flow flex
 * column to the left of the dashboard. All edits write through
 * `useAppearancePreviewStore` for live preview of the draft appearance.
 *
 * The `data-customize-overlay-surface` attribute marks the sidebar as an
 * overlay surface so the `CustomizeOverlay` Tab focus trap enumerates
 * its controls (see `customizeOverlayContext`).
 *
 * Desktop-only by design: the mobile tier never mounts this component,
 * so it carries no responsive viewport branching.
 */
export function CustomizeSidebarDesktop() {
  return (
    <Box
      component="aside"
      aria-label="Customize mode sidebar"
      data-customize-overlay-surface="true"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: CUSTOMIZE_SIDEBAR_WIDTH,
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
