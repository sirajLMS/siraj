import { create } from "zustand";
import type { ManagerRoleFilter, ManagerStatusFilter } from "@/frontend/views/dashboard/managers/home/types";

interface ManagersDirectoryState {
  readonly roleFilter: ManagerRoleFilter;
  readonly statusFilter: ManagerStatusFilter;
  readonly page: number;
  readonly pageSize: number;
  setRoleFilter: (filter: ManagerRoleFilter) => void;
  setStatusFilter: (filter: ManagerStatusFilter) => void;
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
