"use client";

import { useCallback } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { parentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type UseAudienceAutocompleteResult,
  useAudienceAutocomplete,
} from "@/frontend/common/hooks/userAutocomplete/useAudienceAutocomplete";

export function useParentAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const extractRows = useCallback((data: unknown) => {
    const typed = data as {
      parentsDirectory?: readonly {
        id?: string | null;
        name?: string | null;
        avatarUrl?: string | null;
        email?: string | null;
      }[];
    } | null;
    return typed?.parentsDirectory ?? [];
  }, []);

  const buildVariables = useCallback(
    (debouncedSearch: string) => ({
      search: debouncedSearch || null,
      limit: USER_SELECT_LIMIT,
    }),
    []
  );

  return useAudienceAutocomplete({
    audience: "parent",
    document: parentsDirectoryQueryDocument,
    buildVariables,
    extractRows,
    value: args?.value,
    skip: args?.skip,
  });
}
