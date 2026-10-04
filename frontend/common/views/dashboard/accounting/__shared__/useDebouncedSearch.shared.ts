"use client";

import { useEffect, useState } from "react";

/** Debounces the raw search box text so only settled queries hit the server. */
export function useDebouncedSearchWithDelay(search: string, debounceMs: number): string {
  const [debouncedSearch, setDebouncedSearch] = useState(() => search.trim());
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, debounceMs);
    return () => clearTimeout(timeout);
  }, [search, debounceMs]);
  return debouncedSearch;
}
