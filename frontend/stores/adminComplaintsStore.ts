import { create } from "zustand";
import type { ComplaintTab } from "@/frontend/views/dashboard/complaints/types/complaints.types";
import { ComplaintStatus } from "@/frontend/views/dashboard/complaints/types/complaints.types";

interface AdminComplaintsState {
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  clearDraftResponse: (id: string) => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
}

export const useAdminComplaintsStore = create<AdminComplaintsState>(set => ({
  searchQuery: "",
  activeTab: ComplaintStatus.Unanswered,
  draftResponses: {},
  respondingToId: "",
  isResponding: false,
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setActiveTab: tab => {
    set({ activeTab: tab });
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
}));