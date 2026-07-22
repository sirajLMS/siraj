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

function trimToLru(
  map: Readonly<Record<string, CachedAudienceResults>>,
  cacheKey: string,
  entry: CachedAudienceResults
): Record<string, CachedAudienceResults> {
  const next: Record<string, CachedAudienceResults> = { ...map, [cacheKey]: entry };
  const keys = Object.keys(next);
  const overflow = keys.length - USER_SELECT_CACHE_MAX_KEYS_PER_AUDIENCE;
  if (overflow > 0) {
    const sorted = keys.toSorted((a, b) => (next[a]?.updatedAt ?? 0) - (next[b]?.updatedAt ?? 0));
    for (let i = 0; i < overflow; i += 1) {
      const key = sorted[i];
      if (key) {
        delete next[key];
      }
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
