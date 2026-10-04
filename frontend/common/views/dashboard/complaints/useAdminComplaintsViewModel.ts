"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { adminComplaintQueueQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAdminComplaintsStore } from "@/frontend/common/stores/adminComplaintsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import {
  buildAdminComplaintsPaginationArgs,
  buildAdminComplaintsSummary,
} from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel.helpers";
import { useAdminComplaintsActions } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel.hooks";
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

  const { data, loading, error, refetch } = useQuery(adminComplaintQueueQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || null,
        status: activeTab === "all" ? null : activeTab,
      },
      paginationArgs: buildAdminComplaintsPaginationArgs(page, pageSize),
    },
    fetchPolicy: "cache-and-network",
  });

  const actions = useAdminComplaintsActions({ draftResponses, deleteComplaintId, refetch });

  const metrics = data?.adminComplaintQueue?.metrics;
  const summary = useMemo(() => buildAdminComplaintsSummary(metrics), [metrics]);
  const rows: readonly AdminComplaintRow[] = useMemo(
    () => mapAdminComplaintRows(data?.adminComplaintQueue?.rows, labels),
    [data?.adminComplaintQueue?.rows, labels]
  );
  const totalCount = data?.adminComplaintQueue?.totalCount ?? 0;
  const isDeletingComplaint = false;

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
    ...actions,
  };
}
