"use client";

import { useEffect } from "react";
import type { CurrentUserProfile } from "@/backend/types";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";

interface UserStoreInitializerProps {
  readonly userProfile: CurrentUserProfile;
}

export function UserStoreInitializer({ userProfile }: UserStoreInitializerProps) {
  const setUser = useUserStore(state => state.setUser);
  const permissions = userProfile.permissions as unknown as AppPermission[];

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
