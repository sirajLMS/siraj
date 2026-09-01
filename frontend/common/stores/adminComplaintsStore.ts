"use client";

import { create } from "zustand";
import type { ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql";

const DEFAULT_PAGE_SIZE = 10;

type ComplaintTab = ComplaintStatus | "all";

interface AdminComplaintsState {
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly deleteDialogOpen: boolean;
  readonly deleteComplaintId: string | null;
  readonly isDeletingComplaint: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  clearDraftResponse: (id: string) => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
  setPage: (page: number) => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setDeleteComplaintId: (id: string | null) => void;
  setIsDeletingComplaint: (value: boolean) => void;
}

export const useAdminComplaintsStore = create<AdminComplaintsState>(set => ({
  searchQuery: "",
  activeTab: "all",
  draftResponses: {},
  respondingToId: "",
  isResponding: false,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  deleteDialogOpen: false,
  deleteComplaintId: null,
  isDeletingComplaint: false,
  setSearchQuery: query => {
    set({ searchQuery: query, page: 0 });
  },
  setActiveTab: tab => {
    set({ activeTab: tab, page: 0 });
  },
  setDraftResponse: (id, text) => {
    set(state => ({
      draftResponses: { ...state.draftResponses, [id]: text },
    }));
  },
  clearDraftResponse: id => {
    set(state => ({
      draftResponses: Object.fromEntries(Object.entries(state.draftResponses).filter(([key]) => key !== id)),
    }));
  },
  setRespondingToId: id => {
    set({ respondingToId: id });
  },
  setIsResponding: value => {
    set({ isResponding: value });
  },
  resetResponding: () => {
    set({ respondingToId: "", isResponding: false });
  },
  setPage: page => {
    set({ page });
  },
  openDeleteDialog: id => {
    set({ deleteComplaintId: id, deleteDialogOpen: true });
  },
  closeDeleteDialog: () => {
    set({ deleteDialogOpen: false, deleteComplaintId: null });
  },
  setDeleteDialogOpen: open => {
    set({ deleteDialogOpen: open });
  },
  setDeleteComplaintId: id => {
    set({ deleteComplaintId: id });
  },
  setIsDeletingComplaint: value => {
    set({ isDeletingComplaint: value });
  },
}));
