"use client";

import { Box } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { AppearanceErrorBoundary } from "@/frontend/common/views/dashboard/components/customize/AppearanceErrorBoundary";
import { ColorField } from "@/frontend/common/views/dashboard/components/customize/ColorEditorSection";
import { visuallyHiddenSx } from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay.helpers";
import {
  useOverlayEscapeToClose,
  useOverlayFocusRestore,
  useOverlayTabFocusTrap,
  useOverlayUndoRedoShortcuts,
} from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay.hooks";
import { CustomizeToolbar } from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar";
import {
  CustomizeOverlayContext,
  type CustomizeOverlayContextValue,
} from "@/frontend/common/views/dashboard/components/customize/customizeOverlayContext";
import { PresetThemeSection } from "@/frontend/common/views/dashboard/components/customize/PresetThemeSection";

/**
 * Props for {@link CustomizeOverlay}.
 *
 * `children` is rendered inside an `AppearanceErrorBoundary` (when
 * customize mode is on) and a React context that exposes the polite
 * `aria-live` announce function. The overlay always renders children —
 * when customize mode is off, it just provides a no-op announce context
 * so descendants (e.g. `CustomizeToolbar`) can be safely mounted before
 * the overlay opens.
 */
export interface CustomizeOverlayProps {
  readonly children: ReactNode;
}

/**
 * Site-appearance customizer overlay root.
 *
 * Compound composition: the overlay exposes static sub-components
 * (`Toolbar`, `PresetGrid`, `ColorField`) as thin wrappers around the
 * existing editor components so call sites compose like:
 *
 * ```tsx
 * <CustomizeOverlay>
 *   <CustomizeOverlay.Toolbar />
 * </CustomizeOverlay>
 * ```
 *
 * The wrapper adds three cross-cutting concerns that the editor
 * components themselves don't own:
 *
 *  1. **Focus trapping + restoration** — see `CustomizeOverlay.hooks`.
 *     On `Escape`, focus is restored to the captured element and
 *     `?customize=1` is stripped from the URL.
 *  2. **`aria-live="polite"` announcements** — a visually-hidden region
 *     mirrors short status messages ("Draft saved", "Published") for
 *     assistive tech. The toolbar writes via `useCustomizeOverlayAnnounce`.
 *  3. **Error boundary** — when customize mode is on, wraps children in
 *     `AppearanceErrorBoundary` so a render-time crash in any editor
 *     surfaces a "Reset & Exit" fallback that clears the preview store
 *     and closes the overlay. When customize mode is off, no boundary —
 *     the dashboard's own error boundary remains in effect.
 *
 * Mounting: `CustomizeModeShell` renders `<CustomizeOverlay>` once at the
 * top of the dashboard tree, wrapping the entire tree so the toolbar
 * (fixed top, both tiers) and the desktop customize sidebar (an in-flow
 * flex item mounted by the desktop dashboard layout) both live inside
 * the overlay's context.
 */
export function CustomizeOverlay({ children }: Readonly<CustomizeOverlayProps>) {
  const customizeMode = useCustomizeMode();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const resetToDefaults = useAppearancePreviewStore(s => s.resetToDefaults);

  const announce = useCallback(
    (message: string) => {
      if (!customizeMode) return;
      setAnnouncement(message);
    },
    [customizeMode]
  );

  const closeOverlay = useCallback(() => {
    if (!customizeMode) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("customize");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [customizeMode, router, pathname, searchParams]);

  const handleReset = useCallback(() => {
    resetToDefaults();
    closeOverlay();
  }, [resetToDefaults, closeOverlay]);

  useOverlayFocusRestore(customizeMode, previousFocusRef);
  useOverlayEscapeToClose(customizeMode, previousFocusRef, closeOverlay);
  useOverlayUndoRedoShortcuts(customizeMode, announce);
  useOverlayTabFocusTrap(customizeMode);

  const contextValue = useMemo<CustomizeOverlayContextValue>(() => ({ announce }), [announce]);

  const inner = (
    <CustomizeOverlayContext.Provider value={contextValue}>
      {children}
      {customizeMode ? (
        <Box component="span" aria-live="polite" aria-atomic="true" sx={visuallyHiddenSx}>
          {announcement}
        </Box>
      ) : null}
    </CustomizeOverlayContext.Provider>
  );

  if (!customizeMode) return inner;

  return <AppearanceErrorBoundary onReset={handleReset}>{inner}</AppearanceErrorBoundary>;
}

/**
 * Thin wrapper around `CustomizeToolbar` that tags the surface with
 * `data-customize-overlay-surface="true"` so the parent overlay's Tab
 * focus-trap handler enumerates its focusable descendants.
 *
 * `display: contents` keeps the wrapper out of the box model so the
 * toolbar's existing `position: fixed` styling is unaffected.
 */
CustomizeOverlay.Toolbar = function CustomizeOverlayToolbar() {
  return (
    <Box component="span" data-customize-overlay-surface="true" sx={{ display: "contents" }}>
      <CustomizeToolbar />
    </Box>
  );
};

/**
 * Thin wrapper around `PresetThemeSection`. Exposed for composition
 * symmetry — consumers can mount presets in isolation (e.g. inside a
 * future mobile bottom sheet) without importing the sidebar.
 */
CustomizeOverlay.PresetGrid = function CustomizeOverlayPresetGrid() {
  return <PresetThemeSection />;
};

interface CustomizeOverlayColorFieldProps {
  readonly label: string;
  readonly hex: string;
  readonly onChange: (hex: string) => void;
}

/**
 * Thin wrapper around `ColorField` from `ColorEditorSection`. Re-exports
 * the picker + hex-text combo as an overlay compound member so external
 * compositions (e.g. a future "quick colors" popover) can mount it
 * without pulling the whole `ColorEditorSection` (which also renders the
 * Light/Dark `ToggleButtonGroup`).
 */
CustomizeOverlay.ColorField = function CustomizeOverlayColorField({
  label,
  hex,
  onChange,
}: Readonly<CustomizeOverlayColorFieldProps>) {
  return <ColorField label={label} hex={hex} onChange={onChange} />;
};
