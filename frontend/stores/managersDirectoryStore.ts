import { create } from "zustand";

type RoleFilter = "all" | "admin" | "staff";
type StatusFilter = "all" | "active" | "offline";

interface ManagersDirectoryState {
  readonly roleFilter: RoleFilter;
  readonly statusFilter: StatusFilter;
  readonly page: number;
  readonly pageSize: number;
  setRoleFilter: (filter: RoleFilter) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setPage: (page: number) => void;
}

export const useManagersDirectoryStore = create<ManagersDirectoryState>(set => ({
  roleFilter: "all",
  statusFilter: "all",
  page: 0,
  pageSize: 10,
  setRoleFilter: filter => set({ roleFilter: filter, page: 0 }),
  setStatusFilter: filter => set({ statusFilter: filter, page: 0 }),
  setPage: page => set({ page }),
}));
