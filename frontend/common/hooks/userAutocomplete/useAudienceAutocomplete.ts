"use client";

import { useQuery } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import { useEffect, useMemo, useState } from "react";
import type {
  PersonOption,
  UserSelectAudience,
  UserSelectScope,
} from "@/frontend/common/components/ui/input/userSelect/types";
import {
  USER_SELECT_DEBOUNCE_MS,
  USER_SELECT_LIMIT,
} from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import {
  buildUserSelectCacheKey,
  mapRowsToPersonOptions,
  mergeSelectedIntoOptions,
} from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import { useUserAutocompleteStore } from "@/frontend/common/stores/userAutocompleteStore";

export interface UseAudienceAutocompleteArgs {
  readonly audience: UserSelectAudience;
  readonly document: DocumentNode;
  readonly buildVariables: (debouncedSearch: string) => Record<string, unknown>;
  readonly extractRows: (data: unknown) => readonly {
    readonly id?: string | null;
    readonly name?: string | null;
    readonly avatarUrl?: string | null;
    readonly email?: string | null;
  }[];
  readonly value?: PersonOption | null;
  readonly scope?: UserSelectScope | null;
  readonly skip?: boolean;
  /** When true, do not hit network — use extractRows from a static/preloaded path via buildVariables only when not skipped. */
  readonly clientFilterOnly?: boolean;
}

export interface UseAudienceAutocompleteResult {
  readonly options: readonly PersonOption[];
  readonly loading: boolean;
  readonly inputValue: string;
  readonly onInputChange: (value: string) => void;
}

export function useAudienceAutocomplete({
  audience,
  document,
  buildVariables,
  extractRows,
  value = null,
  scope = null,
  skip = false,
}: UseAudienceAutocompleteArgs): UseAudienceAutocompleteResult {
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const setResults = useUserAutocompleteStore(state => state.setResults);
  const getResults = useUserAutocompleteStore(state => state.getResults);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(inputValue.trim());
    }, USER_SELECT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [inputValue]);

  const cacheKey = buildUserSelectCacheKey(audience, debouncedSearch, scope);
  const cached = getResults(audience, cacheKey);

  const { data, loading } = useQuery(document, {
    variables: buildVariables(debouncedSearch),
    skip,
    fetchPolicy: "cache-and-network",
  });

  const fetchedOptions = useMemo(() => {
    if (!data) {
      return cached ?? [];
    }
    return mapRowsToPersonOptions(extractRows(data));
  }, [cached, data, extractRows]);

  useEffect(() => {
    if (!data || skip) {
      return;
    }
    setResults(audience, cacheKey, mapRowsToPersonOptions(extractRows(data)));
  }, [audience, cacheKey, data, extractRows, setResults, skip]);

  const options = useMemo(() => mergeSelectedIntoOptions(fetchedOptions, value), [fetchedOptions, value]);

  return {
    options,
    loading: Boolean(loading) && !cached,
    inputValue,
    onInputChange: setInputValue,
  };
}

export { USER_SELECT_LIMIT };
