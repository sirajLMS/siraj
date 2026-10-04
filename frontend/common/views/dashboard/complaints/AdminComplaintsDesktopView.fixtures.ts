import { AppPermission, ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";

export const MOCK_ADMIN_COMPLAINT_ROWS: readonly AdminComplaintRow[] = [
  {
    id: "cmp-1001",
    submitterName: "Sarah Jenkins",
    submitterRole: "Guardian • Student ID: #SR-9021",
    avatarUrl: "",
    priority: "urgent" as const,
    receivedAt: "2 hours ago",
    complaintText: "The digital portal for the Grade 9 Science assignments seems to be malfunctioning...",
    status: ComplaintStatus.Unanswered,
  },
  {
    id: "cmp-1002",
    submitterName: "David Miller",
    submitterRole: "Guardian • Student ID: #DM-4820",
    avatarUrl: "",
    priority: "general" as const,
    receivedAt: "1 day ago",
    complaintText: "Could we get clarification on the school bus route changes for next week?",
    status: ComplaintStatus.Answered,
    adminResponse: "We have finalized the new routes and sent out a detailed map via email. Please check your inbox.",
    answeredAt: "Oct 24, 2023 • 10:15 AM",
  },
];

export const MOCK_ADMIN_SUMMARY: AdminComplaintsSummary = {
  unanswered: 1,
  answered: 1,
  avgResolutionHours: "4.2 Hours",
};

export const ADMIN_PERMISSIONS = [
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
  AppPermission.ComplaintsDelete,
];

export const mockActions = {
  onSearchChange: (query: string) => {
    logger.info("onSearchChange:", query);
  },
  onTabChange: (tab: ComplaintTab) => {
    logger.info("onTabChange:", tab);
  },
  onDraftChange: (id: string, text: string) => {
    logger.info("onDraftChange:", id, text);
  },
  onAnswer: (id: string, options: { readonly sendEmail: boolean }) => {
    logger.info("onAnswer:", id, options);
  },
  onDelete: (id: string) => {
    logger.info("onDelete:", id);
  },
  onPageChange: (page: number) => {
    logger.info("onPageChange:", page);
  },
  onDeleteDialogClose: () => {
    logger.info("onDeleteDialogClose");
  },
  onDeleteDialogConfirm: () => {
    logger.info("onDeleteDialogConfirm");
  },
};
