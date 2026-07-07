"use client";

import { useEffect } from "react";
import type { AppPermission, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission as BackendAppPermission } from "@/shared/lib/enum";

interface UserStoreInitializerProps {
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
}

function isFrontendPermission(key: string): key is AppPermission {
  return key in BackendAppPermission;
}

export function UserStoreInitializer({ userProfile, isSuperAdmin }: UserStoreInitializerProps) {
  const setUser = useUserStore(state => state.setUser);
  const setActorIsSuperAdmin = useUserStore(state => state.setActorIsSuperAdmin);
  const permissions = (userProfile.permissions || [])
    .map(p => {
      const entry = Object.entries(BackendAppPermission).find(([_, val]) => (val as string) === p);
      return entry ? entry[0] : "";
    })
    .filter(isFrontendPermission);

  useEffect(() => {
    setActorIsSuperAdmin(isSuperAdmin);
    setUser({
      id: userProfile.id || "",
      name: userProfile.name || "",
      email: userProfile.email || "",
      avatarUrl: userProfile.avatarUrl || null,
      permissions,
      notificationCount: userProfile.notificationCount || 0,
      createdAt: userProfile.createdAt ? new Date(userProfile.createdAt).toISOString() : null,
      updatedAt: userProfile.updatedAt ? new Date(userProfile.updatedAt).toISOString() : null,
      emailVerifiedAt: userProfile.emailVerifiedAt ? new Date(userProfile.emailVerifiedAt).toISOString() : null,
      role: userProfile.role || "",
      teacherId: userProfile.teacherId || null,
      parentId: userProfile.parentId || null,
    });
  }, [userProfile, setUser, setActorIsSuperAdmin, permissions, isSuperAdmin]);

  return null;
}
