"use client";

import { useCallback, useState } from "react";
import type { LocalizedString } from "@/shared/types";

type DraftState = { prevValue: LocalizedString; draft: LocalizedString };

/**
 * Holds the in-progress localized string while keeping it in sync with the
 * externally supplied value. The draft resets whenever the incoming value
 * changes, so controlled parents remain the source of truth.
 */
export function useSynchronizedLocalizedStringDraft(
  value: LocalizedString,
  onChangeAction: (value: LocalizedString) => void
): { draft: LocalizedString; emitChange: (next: LocalizedString) => void } {
  const [draftState, setDraftState] = useState<DraftState>({ prevValue: value, draft: value });

  if (draftState.prevValue !== value) {
    setDraftState({ prevValue: value, draft: value });
  }

  const emitChange = useCallback(
    (next: LocalizedString) => {
      setDraftState(prev => ({ ...prev, draft: next }));
      onChangeAction(next);
    },
    [onChangeAction]
  );

  return { draft: draftState.draft, emitChange };
}
