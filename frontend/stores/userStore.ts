import { create } from "zustand";
import type { AppPermission, User } from "../graphql/generated/gql/graphql-types";

export interface UserState {
  user: User | null;
  name: string;
  role: string;
  avatarUrl: string;
  permissions: readonly AppPermission[];
  notificationCount: number;
  setUser: (user: User | null) => void;
  hasPermission: (permission: AppPermission) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  name: "",
  role: "",
  avatarUrl: "",
  permissions: [],
  notificationCount: 0,
  setUser: user =>
    set({
      user,
      name: user?.name || "",
      role: user?.role || "",
      avatarUrl: user?.avatarUrl || "",
      permissions: (user?.permissions as AppPermission[]) || [],
      notificationCount: user?.notificationCount || 0,
    }),
  hasPermission: permission => {
    const permissions = get().user?.permissions || get().permissions || [];
    return permissions.includes(permission);
  },
}));
