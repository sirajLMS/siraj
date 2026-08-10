"use client";

import { useCallback } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { parentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type UseAudienceAutocompleteResult,
  useAudienceAutocomplete,
} from "@/frontend/common/hooks/userAutocomplete/useAudienceAutocomplete";

interface ParentRow {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly avatarUrl?: string | null;
  readonly email?: string | null;
}

interface ParentsDirectoryData {
  readonly parentsDirectory?: readonly ParentRow[];
}

function isParentsDirectoryData(value: unknown): value is ParentsDirectoryData {
  if (typeof value !== "object" || value === null) return false;
  if (!("parentsDirectory" in value)) return true;
  const { parentsDirectory } = value;
  return parentsDirectory === undefined || Array.isArray(parentsDirectory);
}

const EMPTY_ROWS: readonly ParentRow[] = [];

export function useParentAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const extractRows = useCallback((data: unknown) => {
    return isParentsDirectoryData(data) ? (data.parentsDirectory ?? EMPTY_ROWS) : EMPTY_ROWS;
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
