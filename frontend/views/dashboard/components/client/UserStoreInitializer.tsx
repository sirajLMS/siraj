"use client";

import { useEffect } from "react";
import { AppPermission, type User } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";

interface UserStoreInitializerProps {
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
}

function isValidPermission(value: string): value is AppPermission {
  return Object.values(AppPermission).includes(value as AppPermission);
}

export function UserStoreInitializer({ userProfile, isSuperAdmin }: UserStoreInitializerProps) {
  const setUser = useUserStore(state => state.setUser);
  const setActorIsSuperAdmin = useUserStore(state => state.setActorIsSuperAdmin);
  const permissions = (userProfile.permissions || []).filter(isValidPermission);

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
