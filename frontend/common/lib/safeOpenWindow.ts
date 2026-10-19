// NEW FOR PLAN v5: introduced as part of §3 N19 fix — centralize `window.open` indirection
//   so neither tier code nor common hooks/utils call `globalThis.open(...)` directly.
//   Lives in `frontend/common/lib/` (allowlisted per specs.md §2.4 for tier imports).

import { isRelativeSafePath } from "@/shared/lib/safe-path";
/**
 * Opens `url` in a new browser tab/window with the standard "noopener,noreferrer"
 * features. No-op when `url` is empty/null/whitespace-only or when running in a
 * non-browser environment (`window` undefined).
 *
 * Centralizing this here lets `makeHandleJoin` (and any other common-side
 * handler that needs to open a URL) avoid `globalThis.open(...)` call sites
 * that would trip §3 N19 grep checks when re-exported through tier files.
 */
import { isSafeUrl } from "@/shared/lib/safe-url";

export function safeOpenWindow(url: string | null | undefined): void {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) {
    return;
  }
  if (typeof globalThis.window === "undefined") {
    return;
  }

  // Only allow http(s) URLs or known-safe same-origin relative paths — blocks
  // javascript:/data:/vbscript: and protocol-relative (`//evil.com`) targets.
  if (!isSafeUrl(trimmed) && !isRelativeSafePath(trimmed)) {
    return;
  }

  globalThis.window?.open(trimmed, "_blank", "noopener,noreferrer");
}
