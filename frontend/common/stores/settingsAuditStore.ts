import { create } from "zustand";

export const SETTINGS_AUDIT_PAGE_SIZE = 25;

interface SettingsAuditState {
  readonly entityType: string;
  readonly action: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly page: number;
  readonly setEntityType: (entityType: string) => void;
  readonly setAction: (action: string) => void;
  readonly setDateRange: (fromDate: string, toDate: string) => void;
  readonly setPage: (page: number) => void;
  readonly resetPage: () => void;
}

export const useSettingsAuditStore = create<SettingsAuditState>(set => ({
  entityType: "",
  action: "",
  fromDate: "",
  toDate: "",
  page: 0,
  setEntityType: entityType => set({ entityType, page: 0 }),
  setAction: action => set({ action, page: 0 }),
  setDateRange: (fromDate, toDate) => set({ fromDate, toDate, page: 0 }),
  setPage: page => set({ page }),
  resetPage: () => set({ page: 0 }),
}));
