// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";

export type ComplaintTab = "unanswered" | "answered";

export type ComplaintPriority = "urgent" | "general";

export type ComplaintStatus = "unanswered" | "answered";

export interface AdminComplaintsSummary {
  readonly unanswered: number;
  readonly answered: number;
  readonly avgResolutionHours: string;
}

export interface AdminComplaintRow {
  readonly id: string;
  readonly submitterName: string;
  readonly submitterRole: string;
  readonly avatarUrl?: string;
  readonly priority: ComplaintPriority;
  readonly receivedAt: string;
  readonly complaintText: string;
  readonly status: ComplaintStatus;
  readonly adminResponse?: string;
  readonly answeredAt?: string;
}

interface AdminComplaintsState {
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  answerComplaint: (id: string, options: { readonly sendEmail: boolean }) => void;
}

const MOCK_SUMMARY: AdminComplaintsSummary = {
  unanswered: 24,
  answered: 148,
  avgResolutionHours: "4.2 Hours",
};

const MOCK_ROWS: AdminComplaintRow[] = [
  {
    id: "cmp-1001",
    submitterName: "Sarah Jenkins",
    submitterRole: "Guardian • Student ID: #SR-9021",
    avatarUrl: "",
    priority: "urgent",
    receivedAt: "2 hours ago",
    complaintText:
      "The digital portal for the Grade 9 Science assignments seems to be malfunctioning. My son cannot upload his final lab report, and the deadline is tonight. We need an extension or a manual upload option.",
    status: "unanswered",
  },
  {
    id: "cmp-1002",
    submitterName: "Prof. Robert Miller",
    submitterRole: "Faculty • Department of Humanities",
    avatarUrl: "",
    priority: "general",
    receivedAt: "5 hours ago",
    complaintText:
      "The attendance tracking module for the hybrid lecture sessions is not syncing correctly with the mobile app. Several students were marked absent despite being physically present.",
    status: "unanswered",
  },
  {
    id: "cmp-1003",
    submitterName: "Michael Lee",
    submitterRole: "Guardian • Student ID: #SR-4412",
    priority: "general",
    receivedAt: "Oct 20, 2023",
    complaintText: "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: "answered",
    adminResponse:
      "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
    answeredAt: "Oct 24, 2023 • 10:15 AM",
  },
  {
    id: "cmp-1004",
    submitterName: "Fatima Zayed",
    submitterRole: "Guardian • Student ID: #SR-7788",
    priority: "urgent",
    receivedAt: "Sep 10, 2023",
    complaintText: "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: "answered",
    adminResponse:
      "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
    answeredAt: "Sep 12, 2023 • 02:45 PM",
  },
];

export const useAdminComplaintsStore = create<AdminComplaintsState>(set => ({
  summary: MOCK_SUMMARY,
  rows: MOCK_ROWS,
  searchQuery: "",
  activeTab: "unanswered",
  draftResponses: {},
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
  answerComplaint: (id, options) => {
    logger.info("Complaint answered", { id, sendEmail: options.sendEmail });
    set(state => {
      const draft = state.draftResponses[id] ?? "";
      const now = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      return {
        rows: state.rows.map(row =>
          row.id === id
            ? {
                ...row,
                status: "answered" as const,
                adminResponse: draft,
                answeredAt: now,
              }
            : row
        ),
        summary: {
          ...state.summary,
          unanswered: Math.max(state.summary.unanswered - 1, 0),
          answered: state.summary.answered + 1,
        },
        draftResponses: Object.fromEntries(Object.entries(state.draftResponses).filter(([key]) => key !== id)),
      };
    });
  },
}));
