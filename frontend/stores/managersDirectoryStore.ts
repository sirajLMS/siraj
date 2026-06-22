import { create } from "zustand";

type RoleFilter = "all" | "admin" | "staff";
type StatusFilter = "all" | "active" | "offline";

interface ManagersDirectoryState {
  readonly roleFilter: RoleFilter;
  readonly statusFilter: StatusFilter;
  setRoleFilter: (filter: RoleFilter) => void;
  setStatusFilter: (filter: StatusFilter) => void;
}

export const useManagersDirectoryStore = create<ManagersDirectoryState>(set => ({
  roleFilter: "all",
  statusFilter: "all",
  setRoleFilter: filter => set({ roleFilter: filter }),
  setStatusFilter: filter => set({ statusFilter: filter }),
}));
