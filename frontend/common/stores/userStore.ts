"use client";

import { create } from "zustand";
import type { AppPermission, CurrencyCode, MeQuery_me } from "@/frontend/common/graphql/generated/gql/graphql";

export interface UserState {
  user: MeQuery_me | null;
  name: string;
  role: string;
  avatarUrl: string;
  permissions: readonly AppPermission[];
  notificationCount: number;
  displayCurrency: CurrencyCode | null;
  /** Real account flag — stays true while simulating another role. */
  actorIsSuperAdmin: boolean;
  setUser: (user: MeQuery_me | null) => void;
  setActorIsSuperAdmin: (actorIsSuperAdmin: boolean) => void;
  hasPermission: (permission: AppPermission) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  name: "",
  role: "",
  avatarUrl: "",
  permissions: [],
  notificationCount: 0,
  displayCurrency: null,
  actorIsSuperAdmin: false,
  setUser: user =>
    set({
      user,
      name: user?.name ?? "",
      role: user?.role ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      permissions: user?.permissions ?? [],
      notificationCount: user?.notificationCount ?? 0,
      displayCurrency: user?.displayCurrency ?? null,
    }),
  setActorIsSuperAdmin: actorIsSuperAdmin => {
    if (get().actorIsSuperAdmin === actorIsSuperAdmin) {
      return;
    }
    set({ actorIsSuperAdmin });
  },
  hasPermission: permission => {
    const permissions = get().user?.permissions ?? get().permissions ?? [];
    return permissions.includes(permission);
  },
}));
