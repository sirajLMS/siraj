"use client";

import { useEffect } from "react";
import type { CurrentUserProfile } from "@/backend/types";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission as BackendAppPermission } from "@/shared/lib/enum";

interface UserStoreInitializerProps {
  readonly userProfile: CurrentUserProfile;
}

function isFrontendPermission(key: string): key is AppPermission {
  return key in BackendAppPermission;
}

export function UserStoreInitializer({ userProfile }: UserStoreInitializerProps) {
  const setUser = useUserStore(state => state.setUser);
  const permissions = userProfile.permissions
    .map(p => {
      const entry = Object.entries(BackendAppPermission).find(([_, val]) => val === p);
      return entry ? entry[0] : "";
    })
    .filter(isFrontendPermission);

  useEffect(() => {
    setUser({
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      avatarUrl: userProfile.avatarUrl,
      permissions,
      notificationCount: userProfile.notificationCount,
      createdAt: userProfile.createdAt?.toISOString() ?? null,
      updatedAt: userProfile.updatedAt?.toISOString() ?? null,
      emailVerifiedAt: userProfile.emailVerifiedAt?.toISOString() ?? null,
      role: null,
    });
  }, [userProfile, setUser, permissions]);

  return null;
}
