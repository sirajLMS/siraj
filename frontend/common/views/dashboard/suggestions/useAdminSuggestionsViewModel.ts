"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { AppPermission, SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  adminSuggestionsQueryDocument,
  deleteSuggestionMutationDocument,
  markSuggestionDuplicateMutationDocument,
  markSuggestionReviewedMutationDocument,
  respondToSuggestionMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/suggestions/suggestion.documents";
import { useAdminSuggestionsStore } from "@/frontend/common/stores/adminSuggestionsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
} from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { buildSuggestionsLabels } from "@/frontend/common/views/dashboard/suggestions/utils/buildSuggestionsLabels";
import { filterSuggestionsByTab } from "@/frontend/common/views/dashboard/suggestions/utils/suggestionFilters";
import { useAppTranslation } from "@/shared/locale/client";

export interface AdminSuggestionsViewModel {
  readonly labels: SuggestionsAdminLabels;
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly loading?: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: SuggestionStatus) => void;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export interface AdminSuggestionsDialogHandlers {
  readonly respondDialogOpen: string;
  readonly isResponding: boolean;
  readonly duplicateDialogOpen: boolean;
  readonly markingDuplicateId: string;
  readonly isMarkingDuplicate: boolean;
  readonly deleteDialogOpen: boolean;
  readonly deletingId: string;
  readonly isDeleting: boolean;
  readonly error: boolean;
  readonly dialogLabels: SuggestionsAdminLabels["dialogs"];
  readonly closeDeleteDialog: () => void;
  readonly closeRespondDialog: () => void;
  readonly closeDuplicateDialog: () => void;
  readonly onRespondConfirm: (suggestionId: string, adminResponse: string) => void;
  readonly onMarkDuplicateConfirm: (suggestionId: string, duplicateOfId: string) => void;
  readonly onDeleteConfirm: () => void;
}

export function useAdminSuggestionsViewModel(): AdminSuggestionsViewModel & AdminSuggestionsDialogHandlers {
  const t = useAppTranslation("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t);
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);

  const searchQuery = useAdminSuggestionsStore(state => state.searchQuery);
  const activeTab = useAdminSuggestionsStore(state => state.activeTab);
  const setSearchQuery = useAdminSuggestionsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminSuggestionsStore(state => state.setActiveTab);

  const deletingId = useAdminSuggestionsStore(state => state.deletingId);
  const isDeleting = useAdminSuggestionsStore(state => state.isDeleting);
  const deleteDialogOpen = useAdminSuggestionsStore(state => state.deleteDialogOpen);
  const openDeleteDialog = useAdminSuggestionsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useAdminSuggestionsStore(state => state.closeDeleteDialog);
  const setIsDeleting = useAdminSuggestionsStore(state => state.setIsDeleting);

  const respondDialogOpen = useAdminSuggestionsStore(state => state.respondDialogOpen);
  const isResponding = useAdminSuggestionsStore(state => state.isResponding);
  const openRespondDialog = useAdminSuggestionsStore(state => state.openRespondDialog);
  const closeRespondDialog = useAdminSuggestionsStore(state => state.closeRespondDialog);
  const setIsResponding = useAdminSuggestionsStore(state => state.setIsResponding);

  const duplicateDialogOpen = useAdminSuggestionsStore(state => state.duplicateDialogOpen);
  const markingDuplicateId = useAdminSuggestionsStore(state => state.markingDuplicateId);
  const isMarkingDuplicate = useAdminSuggestionsStore(state => state.isMarkingDuplicate);
  const openDuplicateDialog = useAdminSuggestionsStore(state => state.openDuplicateDialog);
  const closeDuplicateDialog = useAdminSuggestionsStore(state => state.closeDuplicateDialog);
  const setIsMarkingDuplicate = useAdminSuggestionsStore(state => state.setIsMarkingDuplicate);

  const canManage = hasPermission(AppPermission.SuggestionsReview);
  const canDelete = hasPermission(AppPermission.SuggestionsDelete);

  const { data, loading, error, refetch } = useQuery(adminSuggestionsQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || null,
        status: activeTab,
        limit: 100,
        offset: 0,
      },
    },
  });

  const [markReviewed] = useMutation(markSuggestionReviewedMutationDocument, {
    onCompleted: () => {
      notifications.show(labels.admin.notifications.markReviewedSuccess, {
        severity: "success",
        autoHideDuration: 4000,
      });
      void refetch();
    },
    onError: () => {
      notifications.show(labels.admin.notifications.markReviewedError, { severity: "error", autoHideDuration: 4000 });
    },
  });

  const [respondToSuggestion] = useMutation(respondToSuggestionMutationDocument, {
    onCompleted: () => {
      closeRespondDialog();
      setIsResponding(false);
      notifications.show(labels.admin.notifications.respondSuccess, { severity: "success", autoHideDuration: 4000 });
      void refetch();
    },
    onError: () => {
      setIsResponding(false);
      notifications.show(labels.admin.notifications.respondError, { severity: "error", autoHideDuration: 4000 });
    },
  });

  const [markDuplicate] = useMutation(markSuggestionDuplicateMutationDocument, {
    onCompleted: () => {
      closeDuplicateDialog();
      setIsMarkingDuplicate(false);
      notifications.show(labels.admin.notifications.markDuplicateSuccess, {
        severity: "success",
        autoHideDuration: 4000,
      });
      void refetch();
    },
    onError: () => {
      setIsMarkingDuplicate(false);
      notifications.show(labels.admin.notifications.markDuplicateError, { severity: "error", autoHideDuration: 4000 });
    },
  });

  const [deleteSuggestion] = useMutation(deleteSuggestionMutationDocument, {
    onCompleted: () => {
      closeDeleteDialog();
      setIsDeleting(false);
      notifications.show(labels.admin.notifications.deleteSuccess, { severity: "success", autoHideDuration: 4000 });
      void refetch();
    },
    onError: () => {
      setIsDeleting(false);
      notifications.show(labels.admin.notifications.deleteError, { severity: "error", autoHideDuration: 4000 });
    },
  });

  const summary: AdminSuggestionsSummary = useMemo(() => {
    const metrics = data?.adminSuggestions?.metrics;
    return {
      pending: metrics?.pending ?? 0,
      reviewed: metrics?.reviewed ?? 0,
      duplicateCount: metrics?.duplicate ?? 0,
      avgResponseHours: metrics?.avgResponseTime ?? "0.0 Hours",
    };
  }, [data?.adminSuggestions?.metrics]);

  const rows: readonly AdminSuggestionRow[] = useMemo(() => {
    if (!data?.adminSuggestions?.rows) return [];
    return data.adminSuggestions.rows.map(row => ({
      id: row.id ?? "",
      parentId: row.parentId ?? null,
      parentUserId: row.parentUserId ?? null,
      parentName: row.parentName ?? "",
      suggestionPreview: row.body ?? "",
      status: row.status ?? SuggestionStatus.Pending,
      submittedAt: row.createdAt ?? "",
      adminResponse: row.adminResponse ?? null,
      duplicateOfBody: row.duplicateOfBody ?? null,
      duplicateOfSubmitterName: row.duplicateOfSubmitterName ?? null,
      responseCount: row.responseCount ?? null,
    }));
  }, [data?.adminSuggestions?.rows]);

  const filteredRows = useMemo(
    () => filterSuggestionsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  const handleMarkReviewed = (id: string) => {
    void markReviewed({ variables: { suggestionId: id } });
  };

  const handleRespond = (id: string) => {
    openRespondDialog(id);
  };

  const handleRespondConfirm = (suggestionId: string, adminResponse: string) => {
    setIsResponding(true);
    void respondToSuggestion({
      variables: { input: { suggestionId, adminResponse } },
    });
  };

  const handleMarkDuplicate = (id: string) => {
    openDuplicateDialog(id);
  };

  const handleMarkDuplicateConfirm = (suggestionId: string, duplicateOfId: string) => {
    setIsMarkingDuplicate(true);
    void markDuplicate({
      variables: { input: { suggestionId, duplicateOfId } },
    });
  };

  const handleDelete = (id: string) => {
    openDeleteDialog(id);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    setIsDeleting(true);
    void deleteSuggestion({ variables: { suggestionId: deletingId } });
  };

  if (error) {
    logger.error("Error loading suggestions:", { error });
  }

  return {
    labels: labels.admin,
    summary,
    rows: filteredRows,
    searchQuery,
    activeTab,
    canManage,
    canDelete,
    loading,
    error: Boolean(error),
    onSearchChange: setSearchQuery,
    onTabChange: setActiveTab,
    onMarkReviewed: handleMarkReviewed,
    onRespond: handleRespond,
    onMarkDuplicate: handleMarkDuplicate,
    onDelete: handleDelete,
    respondDialogOpen,
    isResponding,
    duplicateDialogOpen,
    markingDuplicateId,
    isMarkingDuplicate,
    deleteDialogOpen,
    deletingId,
    isDeleting,
    dialogLabels: labels.admin.dialogs,
    closeDeleteDialog,
    closeRespondDialog,
    closeDuplicateDialog,
    onRespondConfirm: handleRespondConfirm,
    onMarkDuplicateConfirm: handleMarkDuplicateConfirm,
    onDeleteConfirm: handleDeleteConfirm,
  };
}
