"use client";

import { useMemo, useState } from "react";
import type { WhatsappOptInUserState } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/** Parameters for the `useAdminUserSearch` hook. */
export interface UseAdminUserSearchParams {
  readonly adminUsers: readonly WhatsappOptInUserState[];
}

/** Return type of the `useAdminUserSearch` hook. */
export interface UseAdminUserSearchResult {
  readonly search: string;
  readonly setSearch: (value: string) => void;
  readonly filteredUsers: readonly WhatsappOptInUserState[];
}

/**
 * Encapsulates the admin user search state and filtered-users memo shared by
 * the desktop and mobile admin opt-in sections.
 */
export function useAdminUserSearch({ adminUsers }: Readonly<UseAdminUserSearchParams>): UseAdminUserSearchResult {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) {
      return adminUsers;
    }
    return adminUsers.filter(u => u.userName.toLowerCase().includes(trimmed));
  }, [adminUsers, search]);

  return { search, setSearch, filteredUsers };
}
