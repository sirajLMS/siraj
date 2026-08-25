"use client";

import { Box } from "@mui/material";
import { type ReactNode, useEffect } from "react";
import { useAppearanceLivePreview } from "@/frontend/common/hooks/useAppearanceLivePreview";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { CustomizeOverlay } from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay";

const CUSTOMIZE_TOOLBAR_HEIGHT = "48px";
/** Matches `CustomizeSidebar`'s `width: 300` (`frontend/common/views/dashboard/components/customize/CustomizeSidebar.tsx`). */
const CUSTOMIZE_SIDEBAR_WIDTH = 300;

/**
 * Customization layout — sits structurally ABOVE the dashboard layout.
 *
 * When `?customize=1` is active the dashboard is rendered as the shell's
 * content, so the customize chrome (toolbar + sidebar) wraps it instead of
 * being injected into the dashboard's own flex boxes:
 *
 * ```
 * ┌─ Toolbar (fixed, 48px, full width) ──────────────────┐
 * ├──────────────┬───────────────────────────────────────┤
 * │  Customize   │  Dashboard layout (navbar, sidebar,   │
 * │  Sidebar     │  content — completely untouched)      │
 * └──────────────┴───────────────────────────────────────┘
 * ```
 *
 * The offsets the dashboard needs are owned here:
 *  - `--dashboard-shell-height` bounds the dashboard root to the space below
 *    the toolbar (dashboard layouts use `height: var(--dashboard-shell-height, 100vh)`).
 *  - `.MuiAppBar-root` is pushed below the toolbar and inset beside the
 *    sidebar so the navbar never spans the full viewport width on desktop.
 *
 * ## Live preview (BUG-C fix)
 *
 * `useAppearanceLivePreview` is mounted unconditionally (before the early
 * return) so its `useEffect` hooks run on every render. The hook itself
 * checks `store.isCustomizeMode` and only touches the DOM when customize
 * mode is active. On exit, its cleanup restores the original DOM values
 * (brand name, title, logo) so the dashboard reverts to the published state.
 *
 * ## Store sync (BUG-D fix)
 *
 * The `useEffect` below syncs the store's `isCustomizeMode` flag with the
 * URL-based `useCustomizeMode()` result. When `?customize=1` is present +
 * the user has permission, `enterCustomizeMode()` is called — which sets
 * the flag + writes the draft's CSS vars. On exit (URL changes), the cleanup
 * calls `exitCustomizeMode()` — which clears the inline CSS vars so the
 * published theme stylesheet resumes control.
 *
 * Outside customize mode this renders children unchanged.
 */
export function CustomizeModeShell({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const customizeMode = useCustomizeMode();
  const enterCustomizeMode = useAppearancePreviewStore(s => s.enterCustomizeMode);
  const exitCustomizeMode = useAppearancePreviewStore(s => s.exitCustomizeMode);

  // Live preview hook — updates DOM (document.title, brand name, logo) from
  // the draft store. Must be called before any early return (Rules of Hooks).
  useAppearanceLivePreview();

  // Sync the store's isCustomizeMode flag with the URL-based customizeMode.
  // On enter: set flag + write CSS vars from draft. On exit: clear flag +
  // clear CSS vars so published theme takes over (BUG-D revert to current).
  useEffect(() => {
    if (customizeMode) {
      enterCustomizeMode();
      return () => {
        exitCustomizeMode();
      };
    }
    return undefined;
  }, [customizeMode, enterCustomizeMode, exitCustomizeMode]);

  if (!customizeMode) {
    return <>{children}</>;
  }

  return (
    <CustomizeOverlay>
      {/* Reserve space for the fixed-position toolbar. flexShrink:0 prevents the
          body flex-column from collapsing this spacer to 0 when the dashboard
          content exceeds the viewport height (the root cause of BUG-A/B header
          overlap). */}
      <Box aria-hidden sx={{ height: CUSTOMIZE_TOOLBAR_HEIGHT, flexShrink: 0 }} />
      <CustomizeOverlay.Toolbar />
      <Box sx={{ display: "flex", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        {/* The customize sidebar is `position: fixed; top: 0` (see
            CustomizeSidebar.tsx) — pull it below the toolbar so its top
            controls aren't hidden behind it. */}
        <Box sx={{ "& [data-appearance-customize='sidebar']": { top: CUSTOMIZE_TOOLBAR_HEIGHT } }}>
          <CustomizeOverlay.Sidebar />
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            // Bound the dashboard root to the area below the toolbar.
            ["--dashboard-shell-height" as string]: `calc(100dvh - ${CUSTOMIZE_TOOLBAR_HEIGHT})`,
            // Push the fixed navbar below the toolbar; on desktop also inset
            // it beside the customize sidebar (the sidebar hides below md).
            "& .MuiAppBar-root": {
              top: CUSTOMIZE_TOOLBAR_HEIGHT,
              insetInlineStart: { xs: 0, md: `${CUSTOMIZE_SIDEBAR_WIDTH}px` },
              width: { xs: "100%", md: `calc(100% - ${CUSTOMIZE_SIDEBAR_WIDTH}px)` },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </CustomizeOverlay>
  );
}
