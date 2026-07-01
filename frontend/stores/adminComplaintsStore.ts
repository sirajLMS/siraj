import { create } from "zustand";
import { ComplaintStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export type ComplaintTab = ComplaintStatus;

const DEFAULT_PAGE_SIZE = 10;

interface AdminComplaintsState {
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  readonly page: number;
  readonly pageSize: number;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  clearDraftResponse: (id: string) => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
  setPage: (page: number) => void;
}

export const useAdminComplaintsStore = create<AdminComplaintsState>(set => ({
  searchQuery: "",
  activeTab: ComplaintStatus.Unanswered,
  draftResponses: {},
  respondingToId: "",
  isResponding: false,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
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
}));
