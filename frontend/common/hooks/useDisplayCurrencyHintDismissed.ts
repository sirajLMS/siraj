"use client";

import { useState } from "react";

const DISMISS_KEY = "fxDisplayCurrencyHintDismissed";

function readDismissedFromStorage(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function useDisplayCurrencyHintDismissed(): {
  dismissed: boolean;
  dismiss: () => void;
} {
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissedFromStorage());

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // sessionStorage may be unavailable
    }
    setDismissed(true);
  };

  return { dismissed, dismiss };
}
