"use client";

import { createContext, useContext } from "react";

/**
 * Context value exposed by `CustomizeOverlay` to its descendants.
 *
 * `announce` writes a short status message into the overlay's
 * `aria-live="polite"` region (Task 9.9, AC-35). The toolbar calls it
 * alongside `notifications.show()` so screen-reader users hear
 * "Draft saved" / "Published" / "Reset" announcements without a
 * separate toast region.
 *
 * Why a separate module (not inlined in `CustomizeOverlay.tsx`):
 * `CustomizeOverlay` imports `CustomizeToolbar` (via the `.Toolbar`
 * compound wrapper), and `CustomizeToolbar` imports
 * `useCustomizeOverlayAnnounce` from here. Putting the context in a
 * third module breaks the cycle so both files can be type-checked and
 * bundled without ESM live-binding edge cases.
 */
export interface CustomizeOverlayContextValue {
  readonly announce: (message: string) => void;
}

export const CustomizeOverlayContext = createContext<CustomizeOverlayContextValue | null>(null);

/**
 * Read the overlay's `announce` function. Returns a no-op when called
 * outside `CustomizeOverlay` so consumers (e.g. `CustomizeToolbar`) can
 * be unit-tested in isolation without mounting the full overlay.
 */
export function useCustomizeOverlayAnnounce(): (message: string) => void {
  const ctx = useContext(CustomizeOverlayContext);
  return ctx?.announce ?? (() => {});
}

/**
 * DOM attribute set on every focusable surface that belongs to the
 * customizer overlay (toolbar + sidebar). The Tab-key handler in
 * `CustomizeOverlay` queries the document for elements with this
 * attribute to enumerate the overlay's tabbable descendants and cycle
 * focus between them.
 *
 * Using a data attribute (instead of a single ref) lets the toolbar and
 * sidebar live in different positions in the React tree while still
 * participating in the same focus trap — necessary because the desktop
 * layout keeps the dashboard content between them.
 */
export const OVERLAY_SURFACE_ATTR = "data-customize-overlay-surface";
