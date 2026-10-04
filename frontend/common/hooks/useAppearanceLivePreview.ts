"use client";

import { useEffect, useRef } from "react";
import {
  type AppearanceOriginals,
  applyBrandLogo,
  applyBrandText,
  captureAppearanceOriginals,
  restoreAppearanceState,
} from "@/frontend/common/hooks/useAppearanceLivePreview.helpers";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

/**
 * `useAppearanceLivePreview` — Photoshop-like immediate DOM preview hook.
 *
 * When customize mode is active, edits to the draft's scalar brand fields
 * (siteName, siteTitle, siteDescription, logoUrl) are reflected on the live
 * dashboard IMMEDIATELY — before save draft or publish — by directly
 * mutating the DOM elements that display the published brand values.
 *
 * This bridges the gap between the Zustand draft store (which updates
 * instantly) and the server-rendered `NavbarStaticShell` (which renders the
 * published `appTitle` as a server component prop). Without this hook,
 * editing "Site Name" in the customizer sidebar would update the store +
 * the CSS vars but NOT the navbar's visible title until a full page reload
 * after publish.
 *
 * ## What it updates (when customize mode is active):
 *
 * 1. **`document.title`** → `draft.siteTitle` (the browser tab title).
 * 2. **`<meta name="description">`** → `draft.siteDescription`.
 * 3. **Navbar brand name** (`[data-appearance-target="brand-name"]`) →
 *    `draft.siteName` (the visible app title in the header).
 * 4. **Navbar brand logo** (`[data-appearance-target="brand-logo"]`) →
 *    If `draft.logoUrl` is set, replaces the default icon with an `<img>`;
 *    if null, restores the default `SchoolOutlined` icon markup.
 *
 * ## Cleanup
 *
 * On customize mode exit (or unmount), the hook restores the published state
 * to the DOM. When the session published changes (the store's `lastPublished`
 * snapshot), the restore applies those values — the entry-time captures are
 * pre-publish and would stomp the freshly published values back to the old
 * ones. Without a publish, it restores the original DOM values captured on
 * mount, reverting to the server-rendered published state.
 *
 * ## SSR Safety
 *
 * All DOM access is inside `useEffect` — no-ops on the server.
 */
export function useAppearanceLivePreview(): void {
  const isCustomizeMode = useAppearancePreviewStore(s => s.isCustomizeMode);
  const siteName = useAppearancePreviewStore(s => s.draft.siteName);
  const siteTitle = useAppearancePreviewStore(s => s.draft.siteTitle);
  const siteDescription = useAppearancePreviewStore(s => s.draft.siteDescription);
  const logoUrl = useAppearancePreviewStore(s => s.draft.logoUrl ?? null);
  const lastPublished = useAppearancePreviewStore(s => s.lastPublished);

  // Capture the original DOM values on mount so we can restore them on exit.
  const originalsRef = useRef<AppearanceOriginals | null>(null);

  // Capture originals once when customize mode first activates.
  useEffect(() => {
    if (!isCustomizeMode || originalsRef.current) return;
    originalsRef.current = captureAppearanceOriginals();
  }, [isCustomizeMode]);

  // Live-update document.title + meta description + brand name.
  useEffect(() => {
    if (!isCustomizeMode) return;
    applyBrandText(siteName, siteTitle, siteDescription);
  }, [isCustomizeMode, siteName, siteTitle, siteDescription]);

  // Live-update brand logo (swap default icon with uploaded image).
  useEffect(() => {
    if (!isCustomizeMode) return;
    applyBrandLogo(logoUrl, originalsRef.current?.brandLogoHtml ?? null);
  }, [isCustomizeMode, logoUrl]);

  // Restore published state on customize mode exit. A publish inside the
  // session replaces the entry-time captures as the restore target, since
  // those captures hold pre-publish values.
  useEffect(() => {
    if (isCustomizeMode) return;
    const originals = originalsRef.current;
    if (!originals && !lastPublished) return;

    restoreAppearanceState(originals, lastPublished);
    originalsRef.current = null;
  }, [isCustomizeMode, lastPublished]);
}
