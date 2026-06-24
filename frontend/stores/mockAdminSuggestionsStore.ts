// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionStatus,
} from "@/frontend/views/dashboard/suggestions/types/suggestions.types";

export type { AdminSuggestionRow, AdminSuggestionsSummary, SuggestionStatus };

interface AdminSuggestionsState {
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionStatus) => void;
  markReviewed: (id: string) => void;
}

const MOCK_SUMMARY: AdminSuggestionsSummary = {
  pending: 24,
  reviewed: 148,
  avgResponseHours: "4.2 Hours",
};

const MOCK_ROWS: AdminSuggestionRow[] = [
  {
    id: "sug-1001",
    parentName: "Ahmed Khan",
    suggestionPreview: "Could we add a mobile notification when class schedules change?",
    status: "PENDING",
    submittedAt: "Oct 24, 2023",
  },
  {
    id: "sug-1002",
    parentName: "Sara Alii",
    suggestionPreview: "It would help to see attendance summaries in the parent dashboard.",
    status: "PENDING",
    submittedAt: "Oct 23, 2023",
  },
  {
    id: "sug-1003",
    parentName: "John Smith",
    suggestionPreview: "Please offer quarterly billing options for multi-student families.",
    status: "REVIEWED",
    submittedAt: "Oct 20, 2023",
  },
  {
    id: "sug-1004",
    parentName: "Fatima Zayed",
    suggestionPreview: "Add Arabic subtitles to recorded class sessions for review.",
    status: "REVIEWED",
    submittedAt: "Oct 18, 2023",
  },
];

export const useAdminSuggestionsStore = create<AdminSuggestionsState>(set => ({
  summary: MOCK_SUMMARY,
  rows: MOCK_ROWS,
  searchQuery: "",
  activeTab: "PENDING",
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setActiveTab: tab => {
    set({ activeTab: tab });
  },
  markReviewed: id => {
    logger.info("Suggestion marked reviewed", { id });
    set(state => ({
      rows: state.rows.map(row => (row.id === id ? { ...row, status: "REVIEWED" } : row)),
      summary: {
        ...state.summary,
        pending: Math.max(state.summary.pending - 1, 0),
        reviewed: state.summary.reviewed + 1,
      },
    }));
  },
}));
