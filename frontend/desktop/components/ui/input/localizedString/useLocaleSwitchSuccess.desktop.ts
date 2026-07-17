"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Desktop-tier hook that drives a 500ms green-tint flash after a successful locale switch.
 *
 * Caller calls `triggerSuccess()` after committing the draft and after the
 * input settled without error. Returns the `successSwitch` flag to pass to
 * `LocaleAdornmentSwitchDesktop` (or to the parent `TextField` `sx`)
 * and auto-resets after 500ms.
 *
 * Duplicate of `@/frontend/common/components/ui/input/localizedString/useLocaleSwitchSuccess`.
 */
export function useLocaleSwitchSuccess(): {
  readonly successSwitch: boolean;
  readonly triggerSuccess: () => void;
} {
  const [successSwitch, setSuccessSwitch] = useState(false);

  useEffect(() => {
    if (!successSwitch) {
      return;
    }
    const id = setTimeout(() => setSuccessSwitch(false), 500);
    return () => clearTimeout(id);
  }, [successSwitch]);

  const triggerSuccess = useCallback(() => setSuccessSwitch(true), []);
  return { successSwitch, triggerSuccess };
}
