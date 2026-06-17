import { create } from "zustand";
import type { AppPermission, User } from "../graphql/generated/gql/graphql-types";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: AppPermission) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  setUser: user => set({ user }),
  hasPermission: permission => {
    const permissions = get().user?.permissions || [];
    return permissions.includes(permission);
  },
}));
