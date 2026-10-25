"use client";

import { create } from "zustand";
import type { PersonOption, UserSelectAudience } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_CACHE_MAX_KEYS_PER_AUDIENCE } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";

interface CachedAudienceResults {
  readonly options: readonly PersonOption[];
  readonly updatedAt: number;
}

interface UserAutocompleteState {
  readonly byAudience: Readonly<Record<UserSelectAudience, Readonly<Record<string, CachedAudienceResults>>>>;
  setResults: (audience: UserSelectAudience, cacheKey: string, options: readonly PersonOption[]) => void;
  getResults: (audience: UserSelectAudience, cacheKey: string) => readonly PersonOption[] | null;
}

// Fast LRU map trimmer that avoids array sorting and temporary array allocations when overflowing.
function trimToLru(
  map: Readonly<Record<string, CachedAudienceResults>>,
  cacheKey: string,
  entry: CachedAudienceResults
): Record<string, CachedAudienceResults> {
  const next: Record<string, CachedAudienceResults> = { ...map, [cacheKey]: entry };
  const keys = Object.keys(next);
  const overflow = keys.length - USER_SELECT_CACHE_MAX_KEYS_PER_AUDIENCE;

  if (overflow <= 0) {
    return next;
  }

  // When overflowing, remove the oldest entries using a single-pass O(N) scan per excess key
  // to avoid allocating extra array copies or executing V8 sort callbacks.
  for (let i = 0; i < overflow; i += 1) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Number.POSITIVE_INFINITY;

    for (const key in next) {
      const item = next[key];
      if (item && item.updatedAt < oldestTimestamp) {
        oldestTimestamp = item.updatedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      delete next[oldestKey];
    }
  }

  return next;
}

export const useUserAutocompleteStore = create<UserAutocompleteState>((set, get) => ({
  // Each audience starts with its own fresh empty map (isolated references).
  byAudience: {
    teacher: {},
    student: {},
    parent: {},
    user: {},
    staff: {},
  },
  setResults: (audience, cacheKey, options) => {
    set(state => {
      const audienceMap = state.byAudience[audience] ?? {};
      const trimmed = trimToLru(audienceMap, cacheKey, {
        options,
        updatedAt: Date.now(),
      });
      return {
        byAudience: {
          ...state.byAudience,
          [audience]: trimmed,
        },
      };
    });
  },
  getResults: (audience, cacheKey) => {
    return get().byAudience[audience]?.[cacheKey]?.options ?? null;
  },
}));
