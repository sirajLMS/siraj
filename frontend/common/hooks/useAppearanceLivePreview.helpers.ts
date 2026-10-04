"use client";

import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";

export type AppearanceOriginals = {
  readonly documentTitle: string;
  readonly metaDescription: string | null;
  readonly brandNameText: string | null;
  readonly brandLogoHtml: string | null;
};

const META_DESCRIPTION_SELECTOR = 'meta[name="description"]';
const BRAND_NAME_SELECTOR = '[data-appearance-target="brand-name"]';
const BRAND_LOGO_SELECTOR = '[data-appearance-target="brand-logo"]';

export function captureAppearanceOriginals(): AppearanceOriginals {
  const metaDesc = document.querySelector(META_DESCRIPTION_SELECTOR);
  const brandNameEl = document.querySelector(BRAND_NAME_SELECTOR);
  const brandLogoEl = document.querySelector(BRAND_LOGO_SELECTOR);
  return {
    documentTitle: document.title,
    metaDescription: metaDesc?.getAttribute("content") ?? null,
    brandNameText: brandNameEl?.textContent ?? null,
    brandLogoHtml: brandLogoEl?.innerHTML ?? null,
  };
}

export function applyBrandText(siteName: string, siteTitle: string, siteDescription: string): void {
  document.title = siteTitle || document.title;
  const metaDesc = document.querySelector(META_DESCRIPTION_SELECTOR);
  if (metaDesc && siteDescription) {
    metaDesc.setAttribute("content", siteDescription);
  }
  const brandNameEl = document.querySelector(BRAND_NAME_SELECTOR);
  if (brandNameEl) {
    brandNameEl.textContent = siteName;
  }
}

function applyLogoImage(brandLogoEl: Element, logoUrl: string): void {
  const img = document.createElement("img");
  img.src = logoUrl;
  img.alt = "Site logo";
  img.style.width = "24px";
  img.style.height = "24px";
  img.style.objectFit = "contain";
  img.style.borderRadius = "2px";
  brandLogoEl.replaceChildren(img);
}

export function applyBrandLogo(logoUrl: string | null, fallbackHtml: string | null): void {
  const brandLogoEl = document.querySelector(BRAND_LOGO_SELECTOR);
  if (!brandLogoEl) return;

  if (logoUrl) {
    applyLogoImage(brandLogoEl, logoUrl);
  } else if (fallbackHtml != null) {
    brandLogoEl.innerHTML = fallbackHtml;
  }
}

export function restoreAppearanceState(
  originals: AppearanceOriginals | null,
  published: AppearanceDraftInput | null
): void {
  const restoredTitle = published?.siteTitle ?? originals?.documentTitle;
  if (restoredTitle !== undefined) {
    document.title = restoredTitle;
  }
  const restoredDescription = published?.siteDescription ?? originals?.metaDescription;
  const metaDesc = document.querySelector(META_DESCRIPTION_SELECTOR);
  if (metaDesc && restoredDescription != null) {
    metaDesc.setAttribute("content", restoredDescription);
  }
  const restoredBrandName = published?.siteName ?? originals?.brandNameText;
  const brandNameEl = document.querySelector(BRAND_NAME_SELECTOR);
  if (brandNameEl && restoredBrandName != null) {
    brandNameEl.textContent = restoredBrandName;
  }
  applyBrandLogo(published?.logoUrl ?? null, originals?.brandLogoHtml ?? null);
}
