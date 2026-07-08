"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminSuggestionsQueryDocument,
  deleteSuggestionMutationDocument,
  markSuggestionDuplicateMutationDocument,
  markSuggestionReviewedMutationDocument,
  respondToSuggestionMutationDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import { useAdminSuggestionsStore } from "@/frontend/stores/adminSuggestionsStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { AdminSuggestionsView } from "./AdminSuggestionsView";
import { SuggestionMarkDuplicateDialog } from "./components/SuggestionMarkDuplicateDialog";
import { SuggestionRespondDialog } from "./components/SuggestionRespondDialog";
import type { AdminSuggestionRow, AdminSuggestionsSummary } from "./types/suggestions.types";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";
import { filterSuggestionsByTab } from "./utils/suggestionFilters";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const tc = useTranslations("common");
  const labels = buildSuggestionsLabels(t);
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);

  const searchQuery = useAdminSuggestionsStore(state => state.searchQuery);
  const activeTab = useAdminSuggestionsStore(state => state.activeTab);
  const setSearchQuery = useAdminSuggestionsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminSuggestionsStore(state => state.setActiveTab);

  const deleteDialogOpen = useAdminSuggestionsStore(state => state.deleteDialogOpen);
  const deletingId = useAdminSuggestionsStore(state => state.deletingId);
  const isDeleting = useAdminSuggestionsStore(state => state.isDeleting);
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

  const handleRespondSubmit = (suggestionId: string, adminResponse: string) => {
    setIsResponding(true);
    void respondToSuggestion({
      variables: { input: { suggestionId, adminResponse } },
    });
  };

  const handleMarkDuplicate = (id: string) => {
    openDuplicateDialog(id);
  };

  const handleMarkDuplicateSubmit = (suggestionId: string, duplicateOfId: string) => {
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error loading suggestions:", { error });
    return <StyledErrorTypography>{tc("loadFailed")}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.SuggestionsList]}>
      <AdminSuggestionsView
        labels={labels.admin}
        summary={summary}
        rows={filteredRows}
        searchQuery={searchQuery}
        activeTab={activeTab}
        canManage={canManage}
        canDelete={canDelete}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        onMarkReviewed={handleMarkReviewed}
        onRespond={handleRespond}
        onMarkDuplicate={handleMarkDuplicate}
        onDelete={handleDelete}
      />

      <SuggestionRespondDialog
        open={respondDialogOpen !== ""}
        suggestionId={respondDialogOpen}
        isLoading={isResponding}
        labels={labels.admin.dialogs}
        onConfirm={handleRespondSubmit}
        onCancel={closeRespondDialog}
      />

      <SuggestionMarkDuplicateDialog
        open={duplicateDialogOpen}
        suggestionId={markingDuplicateId}
        isLoading={isMarkingDuplicate}
        labels={labels.admin.dialogs}
        onConfirm={handleMarkDuplicateSubmit}
        onCancel={closeDuplicateDialog}
      />

      <Dialog open={deleteDialogOpen} onClose={() => closeDeleteDialog()} maxWidth="xs" fullWidth>
        <DialogTitle>{labels.admin.dialogs.deleteConfirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{labels.admin.dialogs.deleteConfirmBody}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDeleteDialog()} disabled={isDeleting}>
            {labels.admin.dialogs.cancel}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
            {labels.admin.dialogs.deleteConfirmAction}
          </Button>
        </DialogActions>
      </Dialog>
    </RequirePermission>
  );
}
