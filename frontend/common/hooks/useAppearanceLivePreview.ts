"use client";

import { useEffect, useRef } from "react";
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
 * On customize mode exit (or unmount), the hook restores the original DOM
 * values captured on mount, so the dashboard reverts to the server-rendered
 * published state. This satisfies the "exit = revert to current published"
 * requirement (BUG-D).
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

  // Capture the original DOM values on mount so we can restore them on exit.
  const originalsRef = useRef<{
    readonly documentTitle: string;
    readonly metaDescription: string | null;
    readonly brandNameText: string | null;
    readonly brandLogoHtml: string | null;
  } | null>(null);

  // Capture originals once when customize mode first activates.
  useEffect(() => {
    if (!isCustomizeMode || originalsRef.current) return;
    const metaDesc = document.querySelector('meta[name="description"]');
    const brandNameEl = document.querySelector('[data-appearance-target="brand-name"]');
    const brandLogoEl = document.querySelector('[data-appearance-target="brand-logo"]');
    originalsRef.current = {
      documentTitle: document.title,
      metaDescription: metaDesc?.getAttribute("content") ?? null,
      brandNameText: brandNameEl?.textContent ?? null,
      brandLogoHtml: brandLogoEl?.innerHTML ?? null,
    };
  }, [isCustomizeMode]);

  // Live-update document.title + meta description + brand name.
  useEffect(() => {
    if (!isCustomizeMode) return;
    document.title = siteTitle || document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && siteDescription) {
      metaDesc.setAttribute("content", siteDescription);
    }
    const brandNameEl = document.querySelector('[data-appearance-target="brand-name"]');
    if (brandNameEl) {
      brandNameEl.textContent = siteName;
    }
  }, [isCustomizeMode, siteName, siteTitle, siteDescription]);

  // Live-update brand logo (swap default icon with uploaded image).
  useEffect(() => {
    if (!isCustomizeMode) return;
    const brandLogoEl = document.querySelector('[data-appearance-target="brand-logo"]');
    if (!brandLogoEl) return;

    if (logoUrl) {
      // Replace the default SchoolOutlined icon with an <img> of the logo.
      // Preserve the 24px size + centering that the original icon had.
      const img = document.createElement("img");
      img.src = logoUrl;
      img.alt = "Site logo";
      img.style.width = "24px";
      img.style.height = "24px";
      img.style.objectFit = "contain";
      img.style.borderRadius = "2px";
      brandLogoEl.replaceChildren(img);
    } else if (originalsRef.current?.brandLogoHtml) {
      // Restore the original icon markup (SchoolOutlined SVG).
      brandLogoEl.innerHTML = originalsRef.current.brandLogoHtml;
    }
  }, [isCustomizeMode, logoUrl]);

  // Restore originals on customize mode exit.
  useEffect(() => {
    if (isCustomizeMode) return;
    const originals = originalsRef.current;
    if (!originals) return;

    document.title = originals.documentTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && originals.metaDescription !== null) {
      metaDesc.setAttribute("content", originals.metaDescription);
    }
    const brandNameEl = document.querySelector('[data-appearance-target="brand-name"]');
    if (brandNameEl && originals.brandNameText !== null) {
      brandNameEl.textContent = originals.brandNameText;
    }
    const brandLogoEl = document.querySelector('[data-appearance-target="brand-logo"]');
    if (brandLogoEl && originals.brandLogoHtml !== null) {
      brandLogoEl.innerHTML = originals.brandLogoHtml;
    }

    originalsRef.current = null;
  }, [isCustomizeMode]);
}
