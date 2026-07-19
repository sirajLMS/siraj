"use client";

import { useCallback } from "react";
import type { PersonOption, UserSelectScope } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { staffDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type UseAudienceAutocompleteResult,
  useAudienceAutocomplete,
} from "@/frontend/common/hooks/userAutocomplete/useAudienceAutocomplete";

/**
 * Staff audience autocomplete.
 * `permissionGroupFilter` reuses manager-directory semantics: `"admin"` | `"staff"`.
 */
export function useStaffAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly scope?: UserSelectScope | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const permissionGroupFilter = args?.scope?.permissionGroupFilter ?? null;

  const extractRows = useCallback((data: unknown) => {
    const typed = data as {
      staffDirectory?: readonly {
        id?: string | null;
        name?: string | null;
        avatarUrl?: string | null;
        email?: string | null;
      }[];
    } | null;
    return typed?.staffDirectory ?? [];
  }, []);

  const buildVariables = useCallback(
    (debouncedSearch: string) => ({
      search: debouncedSearch || null,
      limit: USER_SELECT_LIMIT,
      permissionGroupFilter,
    }),
    [permissionGroupFilter]
  );

  return useAudienceAutocomplete({
    audience: "staff",
    document: staffDirectoryQueryDocument,
    buildVariables,
    extractRows,
    value: args?.value,
    scope: args?.scope,
    skip: args?.skip,
  });
}
