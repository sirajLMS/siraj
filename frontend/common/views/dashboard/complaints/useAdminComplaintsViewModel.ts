"use client";

import { useAdminComplaintsStore } from "@/frontend/common/stores/adminComplaintsStore";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsAdminLabels } from "@/shared/locale";

export interface AdminComplaintsViewModel {
  readonly labels: ComplaintsAdminLabels;
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly deleteDialogOpen: boolean;
  readonly deleteComplaintId: string | null;
  readonly isDeletingComplaint: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: ComplaintTab) => void;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onDeleteDialogClose: () => void;
  readonly onDeleteDialogConfirm: () => void;
}

export interface UseAdminComplaintsViewModelProps {
  readonly labels: ComplaintsAdminLabels;
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly totalCount: number;
  readonly isDeletingComplaint: boolean;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteConfirm: () => void;
  readonly onRefetch: () => void;
}

export function useAdminComplaintsViewModel(
  props: Readonly<UseAdminComplaintsViewModelProps>
): AdminComplaintsViewModel {
  const { labels, summary, rows, canManage, canDelete, totalCount, isDeletingComplaint, onAnswer, onDeleteConfirm } =
    props;

  const searchQuery = useAdminComplaintsStore(state => state.searchQuery);
  const activeTab = useAdminComplaintsStore(state => state.activeTab);
  const draftResponses = useAdminComplaintsStore(state => state.draftResponses);
  const page = useAdminComplaintsStore(state => state.page);
  const pageSize = useAdminComplaintsStore(state => state.pageSize);
  const deleteDialogOpen = useAdminComplaintsStore(state => state.deleteDialogOpen);
  const deleteComplaintId = useAdminComplaintsStore(state => state.deleteComplaintId);

  const setSearchQuery = useAdminComplaintsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminComplaintsStore(state => state.setActiveTab);
  const setDraftResponse = useAdminComplaintsStore(state => state.setDraftResponse);
  const setPage = useAdminComplaintsStore(state => state.setPage);
  const openDeleteDialog = useAdminComplaintsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useAdminComplaintsStore(state => state.closeDeleteDialog);

  return {
    labels,
    summary,
    rows,
    searchQuery,
    activeTab,
    draftResponses,
    canManage,
    canDelete,
    page,
    pageSize,
    totalCount,
    deleteDialogOpen,
    deleteComplaintId,
    isDeletingComplaint,
    onSearchChange: setSearchQuery,
    onTabChange: setActiveTab,
    onDraftChange: setDraftResponse,
    onAnswer,
    onDelete: openDeleteDialog,
    onPageChange: setPage,
    onDeleteDialogClose: closeDeleteDialog,
    onDeleteDialogConfirm: onDeleteConfirm,
  };
}
