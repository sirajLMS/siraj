"use client";

import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.constants";

interface SearchInputState {
  readonly inputValue: string;
  readonly setInputValue: (value: string) => void;
}

/**
 * Local search text mirroring the store: keystrokes update the input instantly
 * and the store (which drives the query) only receives the settled text after
 * the debounce window. External store resets (e.g. Clear) re-echo into the
 * input through the render-time adjustment (React's recommended alternative to
 * resetting state inside an effect), which then makes the debounce a no-op.
 */
export function useDebouncedSearchInput(search: string, setSearch: (value: string) => void): SearchInputState {
  const [inputValue, setInputValue] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (syncedSearch !== search) {
    setSyncedSearch(search);
    setInputValue(search);
  }
  useEffect(() => {
    if (inputValue === search) return undefined;
    const timeout = setTimeout(() => setSearch(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [inputValue, search, setSearch]);
  return { inputValue, setInputValue };
}
