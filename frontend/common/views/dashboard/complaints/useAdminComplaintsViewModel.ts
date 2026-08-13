"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { AppPermission, type PaginationArgs } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  adminComplaintQueueQueryDocument,
  deleteComplaintMutationDocument,
  respondToComplaintMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAdminComplaintsStore } from "@/frontend/common/stores/adminComplaintsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { mapAdminComplaintRows } from "@/frontend/common/views/dashboard/complaints/utils/mapAdminComplaintRows";
import { type ComplaintsAdminLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";

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
  readonly loading: boolean;
  readonly error: Error | null;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: ComplaintTab) => void;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onDeleteDialogClose: () => void;
  readonly onDeleteDialogConfirm: () => void;
  readonly onRefetch: () => void;
}

export type UseAdminComplaintsViewModelProps = Record<string, never>;

function buildLabels(t: ComplaintsLabels): ComplaintsAdminLabels {
  return buildComplaintsLabels(t).admin;
}

export function useAdminComplaintsViewModel(
  _props: Readonly<UseAdminComplaintsViewModelProps>
): AdminComplaintsViewModel {
  const complaintsT = useAppTranslation(Translation.Dashboard.Complaints);
  const labels = useMemo(() => buildLabels(complaintsT), [complaintsT]);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.ComplaintsRespond);
  const canDelete = hasPermission(AppPermission.ComplaintsDelete);

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
  const resetResponding = useAdminComplaintsStore(state => state.resetResponding);

  const paginationArgs: PaginationArgs = {
    first: pageSize,
    page: page + 1,
    after: null,
    before: null,
    last: null,
    maxCount: null,
    skip: null,
  };

  const { data, loading, error, refetch } = useQuery(adminComplaintQueueQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || null,
        status: activeTab === "all" ? null : activeTab,
      },
      paginationArgs,
    },
    fetchPolicy: "cache-and-network",
  });

  const [respondToComplaintMutation] = useMutation(respondToComplaintMutationDocument);
  const [deleteComplaintMutation] = useMutation(deleteComplaintMutationDocument);

  const summary: AdminComplaintsSummary = useMemo(
    () =>
      data?.adminComplaintQueue?.metrics
        ? {
            unanswered: data.adminComplaintQueue.metrics.unanswered ?? 0,
            answered: data.adminComplaintQueue.metrics.answered ?? 0,
            avgResolutionHours: data.adminComplaintQueue.metrics.avgResolutionTime ?? "0.0 Hours",
          }
        : { unanswered: 0, answered: 0, avgResolutionHours: "0.0 Hours" },
    [data?.adminComplaintQueue?.metrics]
  );
  const rows: readonly AdminComplaintRow[] = useMemo(
    () => mapAdminComplaintRows(data?.adminComplaintQueue?.rows, labels),
    [data?.adminComplaintQueue?.rows, labels]
  );
  const totalCount = data?.adminComplaintQueue?.totalCount ?? 0;

  const isDeletingComplaint = false;

  const handleAnswer = async (id: string, _options: { readonly sendEmail: boolean }) => {
    const draft = draftResponses[id];
    if (!draft) return;

    try {
      await respondToComplaintMutation({
        variables: { input: { complaintId: id, body: draft } },
      });
      setDraftResponse(id, "");
      resetResponding();
      await refetch();
    } catch (e) {
      logger.error("Failed to respond to complaint", { error: e });
    }
  };

  const handleDelete = (id: string) => {
    openDeleteDialog(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteComplaintId) return;

    try {
      await deleteComplaintMutation({ variables: { complaintId: deleteComplaintId } });
      closeDeleteDialog();
      await refetch();
    } catch (e) {
      logger.error("Failed to delete complaint", { error: e });
    }
  };

  const handleRefetch = () => {
    void refetch();
  };

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
    loading,
    error: error ?? null,
    onSearchChange: setSearchQuery,
    onTabChange: setActiveTab,
    onDraftChange: setDraftResponse,
    onAnswer: handleAnswer,
    onDelete: handleDelete,
    onPageChange: setPage,
    onDeleteDialogClose: closeDeleteDialog,
    onDeleteDialogConfirm: handleDeleteConfirm,
    onRefetch: handleRefetch,
  };
}
