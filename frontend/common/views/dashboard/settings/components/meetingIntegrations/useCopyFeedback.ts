import { useCallback, useState } from "react";

/** Visually-hidden style for sr-only live regions (e.g. copy-to-clipboard feedback). */
export const srOnlySx = {
  position: "absolute",
  left: -9999,
  width: 1,
  height: 1,
  overflow: "hidden",
} as const;

/**
 * Manages a "copied" transient flag for clipboard copy buttons.
 * Resets after `resetMs` so the visual feedback icon/label reverts.
 */
export function useCopyFeedback(resetMs = 2000): readonly [boolean, (value: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        globalThis.setTimeout(() => setCopied(false), resetMs);
      } catch {
        // Clipboard not available — silently ignore
      }
    },
    [resetMs]
  );

  return [copied, copy] as const;
}
