"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "fxDisplayCurrencyHintDismissed";

export function useDisplayCurrencyHintDismissed(): {
  dismissed: boolean;
  dismiss: () => void;
} {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

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
