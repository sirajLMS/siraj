import { type RefObject, useCallback, useEffect } from "react";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { listOverlayFocusables } from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay.helpers";

/**
 * Subscribes `handler` to `document` keydown events on the capture phase
 * while `enabled` is true, and unsubscribes on cleanup. Shared by the
 * overlay's Escape, undo/redo, and Tab focus-trap listeners.
 */
function useCaptureKeydown(enabled: boolean, handler: (event: KeyboardEvent) => void): void {
  useEffect(() => {
    if (!enabled) return undefined;
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [enabled, handler]);
}

/** Capture previously-focused element on enter; restore on exit. */
export function useOverlayFocusRestore(customizeMode: boolean, previousFocusRef: RefObject<HTMLElement | null>): void {
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
  }, [customizeMode, previousFocusRef]);
}

/** Escape key: close overlay + restore focus (AC-35). */
export function useOverlayEscapeToClose(
  customizeMode: boolean,
  previousFocusRef: RefObject<HTMLElement | null>,
  closeOverlay: () => void
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const target = previousFocusRef.current;
      if (target) {
        target.focus();
      }
      closeOverlay();
    },
    [previousFocusRef, closeOverlay]
  );

  useCaptureKeydown(customizeMode, handleKeyDown);
}

/**
 * Undo/Redo keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) — AC-35.
 * Skipped when focus is inside a text input/textarea so the browser's native
 * undo works in text fields (deferred-items #6).
 */
export function useOverlayUndoRedoShortcuts(customizeMode: boolean, announce: (message: string) => void): void {
  const undo = useAppearancePreviewStore(s => s.undo);
  const redo = useAppearancePreviewStore(s => s.redo);
  const canUndo = useAppearancePreviewStore(s => s.canUndo());
  const canRedo = useAppearancePreviewStore(s => s.canRedo());

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [undo, redo, canUndo, canRedo, announce]
  );

  useCaptureKeydown(customizeMode, handleKeyDown);
}

/** Tab focus trap: cycle within overlay surfaces only. */
export function useOverlayTabFocusTrap(customizeMode: boolean): void {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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
  }, []);

  useCaptureKeydown(customizeMode, handleKeyDown);
}
