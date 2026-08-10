"use client";

import { useLayoutEffect } from "react";
import { AppPermission, type User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";

interface UserStoreInitializerProps {
  readonly userProfile: User;
  readonly isSuperAdmin: boolean;
}

const VALID_PERMISSIONS = new Set(Object.values(AppPermission) as readonly string[]);

function isValidPermission(value: string): value is AppPermission {
  return VALID_PERMISSIONS.has(value);
}

export function UserStoreInitializer({ userProfile, isSuperAdmin }: UserStoreInitializerProps) {
  const setUser = useUserStore(state => state.setUser);
  const setActorIsSuperAdmin = useUserStore(state => state.setActorIsSuperAdmin);

  useLayoutEffect(() => {
    // Filter inside the effect — a new `.filter()` array each render in the
    // dependency list re-fires this effect after setUser notifies subscribers
    // (e.g. DashboardClientBridge → useNotificationsDrawerViewModel).
    const permissions = (userProfile.permissions || []).filter(isValidPermission);
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
      displayCurrency: userProfile.displayCurrency,
      phone: userProfile.phone ?? null,
      status: userProfile.status ?? null,
    });
  }, [userProfile, setUser, setActorIsSuperAdmin, isSuperAdmin]);

  return null;
}
