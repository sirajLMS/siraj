"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";

/**
 * Clipboard-copy state machine for `CopyMeetingUrlButton`: owns the transient
 * "copied"/"error" state, the revert timer, and the mounted guard so state is
 * never written after unmount.
 */

export type CopyState = "default" | "copied" | "error";

/**
 * Clipboard write with fallback for older browsers.
 * Returns `true` if the text was written, `false` otherwise.
 */
async function writeClipboardText(text: string, allowFallback: boolean): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (allowFallback) {
      return execFallbackCopy(text);
    }
    return false;
  }
}

/**
 * Fallback using a hidden `textarea` + legacy clipboard copy.
 * Required for older browsers and insecure contexts where `navigator.clipboard` is unavailable.
 */
function execFallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const execCopy: (commandId: string) => boolean = document.execCommand.bind(document);
  let succeeded = false;
  try {
    succeeded = execCopy("copy");
  } catch {
    // execCommand not supported — succeeded stays false
  }
  document.body.removeChild(textarea);
  return succeeded;
}

interface UseClipboardCopyStateOptions {
  readonly text: string;
  readonly disabled: boolean;
  readonly copiedDurationMs: number;
  readonly onCopySuccess?: () => void;
  readonly onCopyError?: () => void;
}

interface ClipboardCopyStateResult {
  readonly copyState: CopyState;
  readonly handleCopy: () => Promise<void>;
}

export function useClipboardCopyState({
  text,
  disabled,
  copiedDurationMs,
  onCopySuccess,
  onCopyError,
}: UseClipboardCopyStateOptions): ClipboardCopyStateResult {
  const [copyState, setCopyState] = useState<CopyState>("default");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        globalThis.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (disabled) return;

    const allowFallback = typeof navigator !== "undefined" && !navigator.clipboard;
    const succeeded = await writeClipboardText(text, allowFallback);

    if (!mountedRef.current) return;

    if (succeeded) {
      if (timerRef.current !== null) {
        globalThis.clearTimeout(timerRef.current);
      }
      setCopyState("copied");

      timerRef.current = globalThis.setTimeout(() => {
        if (mountedRef.current) {
          setCopyState("default");
          timerRef.current = null;
        }
      }, copiedDurationMs);

      onCopySuccess?.();
    } else {
      logger.warn("Clipboard write failed for meeting URL");
      setCopyState("error");
      onCopyError?.();
    }
  }, [disabled, text, copiedDurationMs, onCopySuccess, onCopyError]);

  return { copyState, handleCopy };
}
