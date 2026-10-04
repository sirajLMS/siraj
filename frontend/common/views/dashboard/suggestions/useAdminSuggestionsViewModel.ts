"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { AppPermission, type SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { adminSuggestionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/suggestions/suggestion.documents";
import { useAdminSuggestionsStore } from "@/frontend/common/stores/adminSuggestionsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildAdminSuggestionsSummary,
  mapAdminSuggestionRows,
} from "@/frontend/common/views/dashboard/suggestions/adminSuggestionsData.helpers";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
} from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { useAdminSuggestionsActions } from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsActions.hooks";
import { buildSuggestionsLabels } from "@/frontend/common/views/dashboard/suggestions/utils/buildSuggestionsLabels";
import { filterSuggestionsByTab } from "@/frontend/common/views/dashboard/suggestions/utils/suggestionFilters";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  const labels = buildSuggestionsLabels(useAppTranslation(Translation.Dashboard.Suggestions));
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const notifySuccess = (msg: string) => notifications.show(msg, { severity: "success", autoHideDuration: 4000 });
  const notifyError = (msg: string) => notifications.show(msg, { severity: "error", autoHideDuration: 4000 });

  const searchQuery = useAdminSuggestionsStore(state => state.searchQuery);
  const activeTab = useAdminSuggestionsStore(state => state.activeTab);
  const setSearchQuery = useAdminSuggestionsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminSuggestionsStore(state => state.setActiveTab);

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

  const dialogHandlers = useAdminSuggestionsActions({ notifySuccess, notifyError, labels: labels.admin, refetch });

  const summary: AdminSuggestionsSummary = useMemo(
    () => buildAdminSuggestionsSummary(data?.adminSuggestions?.metrics),
    [data?.adminSuggestions?.metrics]
  );

  const rows: readonly AdminSuggestionRow[] = useMemo(
    () => mapAdminSuggestionRows(data?.adminSuggestions?.rows),
    [data]
  );

  const filteredRows = useMemo(
    () => filterSuggestionsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

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
    ...dialogHandlers,
  };
}
