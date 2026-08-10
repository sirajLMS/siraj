"use client";

import { useCallback } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { usersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type UseAudienceAutocompleteResult,
  useAudienceAutocomplete,
} from "@/frontend/common/hooks/userAutocomplete/useAudienceAutocomplete";

type UserData = {
  readonly users?: readonly {
    readonly id?: string | null;
    readonly name?: string | null;
    readonly avatarUrl?: string | null;
    readonly email?: string | null;
  }[];
};

function isUserData(data: unknown): data is UserData {
  return typeof data === "object" && data !== null;
}

export function useUserAutocomplete(args?: {
  readonly value?: PersonOption | null;
  readonly skip?: boolean;
}): UseAudienceAutocompleteResult {
  const extractRows = useCallback((data: unknown) => {
    return isUserData(data) ? (data.users ?? []) : [];
  }, []);

  const buildVariables = useCallback(
    (debouncedSearch: string) => ({
      search: debouncedSearch || null,
      limit: USER_SELECT_LIMIT,
      offset: 0,
    }),
    []
  );

  return useAudienceAutocomplete({
    audience: "user",
    document: usersQueryDocument,
    buildVariables,
    extractRows,
    value: args?.value,
    skip: args?.skip,
  });
}
