"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
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
 * Outside customize mode this renders children unchanged.
 */
export function CustomizeModeShell({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const customizeMode = useCustomizeMode();

  if (!customizeMode) {
    return <>{children}</>;
  }

  return (
    <CustomizeOverlay>
      {/* Reserve space for the fixed-position toolbar. */}
      <Box aria-hidden sx={{ height: CUSTOMIZE_TOOLBAR_HEIGHT }} />
      <CustomizeOverlay.Toolbar />
      <Box sx={{ display: "flex", alignItems: "stretch" }}>
        <CustomizeOverlay.Sidebar />
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
