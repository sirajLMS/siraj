"use client";

import { useEffect } from "react";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";

/**
 * Starts a fresh form session on mount: issues a new double-submit guard token
 * and seeds the deep-linked student. Unmounting restores the pristine form so a
 * later visit never inherits stale values.
 */
export function useCreditAdjustFormSession(preselectedStudentId: string | null) {
  const setStudentId = useCreditAdjustFormStore(state => state.setStudentId);
  const regenerateClientRequestId = useCreditAdjustFormStore(state => state.regenerateClientRequestId);
  const reset = useCreditAdjustFormStore(state => state.reset);

  useEffect(() => {
    regenerateClientRequestId();
    if (preselectedStudentId !== null) setStudentId(preselectedStudentId);
    return () => {
      reset();
    };
  }, [preselectedStudentId, regenerateClientRequestId, setStudentId, reset]);
}
