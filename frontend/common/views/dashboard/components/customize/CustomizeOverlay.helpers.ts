import { OVERLAY_SURFACE_ATTR } from "@/frontend/common/views/dashboard/components/customize/customizeOverlayContext";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])';

function isFocusable(el: Element): el is HTMLElement {
  return el instanceof HTMLElement;
}

export function listOverlayFocusables(): HTMLElement[] {
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

/** Visually-hidden `sx` for the polite `aria-live` status mirror. */
export const visuallyHiddenSx = {
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
} as const;
