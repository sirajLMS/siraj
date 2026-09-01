"use client";

import { Box } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { AppearanceErrorBoundary } from "@/frontend/common/views/dashboard/components/customize/AppearanceErrorBoundary";
import { ColorField } from "@/frontend/common/views/dashboard/components/customize/ColorEditorSection";
import { CustomizeToolbar } from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar";
import {
  CustomizeOverlayContext,
  type CustomizeOverlayContextValue,
  OVERLAY_SURFACE_ATTR,
} from "@/frontend/common/views/dashboard/components/customize/customizeOverlayContext";
import { PresetThemeSection } from "@/frontend/common/views/dashboard/components/customize/PresetThemeSection";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])';

function isFocusable(el: Element): el is HTMLElement {
  return el instanceof HTMLElement;
}

function listOverlayFocusables(): HTMLElement[] {
  if (typeof document === "undefined") return [];
  const surfaces = document.querySelectorAll<HTMLElement>(`[${OVERLAY_SURFACE_ATTR}="true"]`);
  const acc: HTMLElement[] = [];
  surfaces.forEach(surface => {
    surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach(el => {
      if (isFocusable(el)) acc.push(el);
    });
  });
  return acc;
}

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
 *  1. **Focus trapping + restoration** — on enter, the
 *     previously-focused element is captured into `previousFocusRef`.
 *     While open, Tab / Shift+Tab cycles focus within the overlay
 *     surfaces (toolbar and, on desktop, the customize sidebar). On
 *     `Escape`, focus is restored to the captured element and
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
  const undo = useAppearancePreviewStore(s => s.undo);
  const redo = useAppearancePreviewStore(s => s.redo);
  const canUndo = useAppearancePreviewStore(s => s.canUndo());
  const canRedo = useAppearancePreviewStore(s => s.canRedo());

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

  // Capture previously-focused element on enter; restore on exit.
  useEffect(() => {
    if (!customizeMode) return undefined;
    const previouslyFocused = document.activeElement;
    previousFocusRef.current = previouslyFocused instanceof HTMLElement ? previouslyFocused : null;
    return () => {
      const target = previousFocusRef.current;
      if (target) {
        target.focus();
      }
    };
  }, [customizeMode]);

  // Escape key: close overlay + restore focus (AC-35).
  useEffect(() => {
    if (!customizeMode) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const target = previousFocusRef.current;
      if (target) {
        target.focus();
      }
      closeOverlay();
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [customizeMode, closeOverlay]);

  // Tab focus trap: cycle within overlay surfaces only.
  // Undo/Redo keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) — AC-35.
  // Skipped when focus is inside a text input/textarea so the browser's native
  // undo works in text fields (deferred-items #6).
  useEffect(() => {
    if (!customizeMode) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;
      if (!ctrlOrCmd) return;
      const active = document.activeElement;
      const isTextInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (isTextInput) return;
      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
          announce("Undo");
        }
      } else if ((event.key === "z" && event.shiftKey) || event.key === "y") {
        event.preventDefault();
        if (canRedo) {
          redo();
          announce("Redo");
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [customizeMode, undo, redo, canUndo, canRedo, announce]);

  // Tab focus trap: cycle within overlay surfaces only.
  useEffect(() => {
    if (!customizeMode) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = listOverlayFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      const activeInOverlay = focusables.includes(active);
      if (event.shiftKey) {
        if (!activeInOverlay || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [customizeMode]);

  const contextValue = useMemo<CustomizeOverlayContextValue>(() => ({ announce }), [announce]);

  const inner = (
    <CustomizeOverlayContext.Provider value={contextValue}>
      {children}
      {customizeMode ? (
        <Box
          component="span"
          aria-live="polite"
          aria-atomic="true"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            margin: -1,
            padding: 0,
            border: 0,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
          }}
        >
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
