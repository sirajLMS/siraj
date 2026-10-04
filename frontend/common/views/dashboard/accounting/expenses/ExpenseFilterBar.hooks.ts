"use client";

import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.helpers";

interface TitleInputState {
  readonly inputValue: string;
  readonly setInputValue: (value: string) => void;
}

/**
 * Local title text mirroring the store: keystrokes update the input instantly
 * and the store (which drives the query) only receives the settled text after
 * the debounce window. External store resets (e.g. Clear) re-echo into the
 * input through the render-time adjustment (React's recommended alternative to
 * resetting state inside an effect), which then makes the debounce a no-op.
 */
export function useDebouncedTitleInput(title: string, setTitle: (value: string) => void): TitleInputState {
  const [inputValue, setInputValue] = useState(title);
  const [syncedTitle, setSyncedTitle] = useState(title);
  if (syncedTitle !== title) {
    setSyncedTitle(title);
    setInputValue(title);
  }
  useEffect(() => {
    if (inputValue === title) return undefined;
    const timeout = setTimeout(() => setTitle(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [inputValue, title, setTitle]);
  return { inputValue, setInputValue };
}
