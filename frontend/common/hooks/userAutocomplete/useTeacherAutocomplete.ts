"use client";

import { useCallback } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type UseAudienceAutocompleteResult,
  useAudienceAutocomplete,
} from "@/frontend/common/hooks/userAutocomplete/useAudienceAutocomplete";

interface TeacherData {
  readonly teachers?: readonly {
    readonly id?: string | null;
    readonly name?: string | null;
    readonly avatarUrl?: string | null;
  }[];
}

function isTeacherData(value: unknown): value is TeacherData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function useTeacherAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const extractRows = useCallback((data: unknown) => {
    const typed = isTeacherData(data) ? data : null;
    return typed?.teachers ?? [];
  }, []);

  const buildVariables = useCallback(
    (debouncedSearch: string) => ({
      search: debouncedSearch,
      limit: USER_SELECT_LIMIT,
    }),
    []
  );

  return useAudienceAutocomplete({
    audience: "teacher",
    document: teachersQueryDocument,
    buildVariables,
    extractRows,
    value: args?.value,
    skip: args?.skip,
  });
}
