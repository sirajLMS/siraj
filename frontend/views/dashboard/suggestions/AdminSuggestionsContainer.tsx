"use client";

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
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { AdminSuggestionsView } from "@/frontend/views/dashboard/suggestions/adminSuggestionsView";
import { SuggestionMarkDuplicateDialog } from "@/frontend/views/dashboard/suggestions/components/SuggestionMarkDuplicateDialog";
import { SuggestionRespondDialog } from "@/frontend/views/dashboard/suggestions/components/SuggestionRespondDialog";
import { useAdminSuggestionsViewModel } from "@/frontend/views/dashboard/suggestions/useAdminSuggestionsViewModel";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminSuggestionsContainer() {
  const tc = useTranslations("common");
  const viewModel = useAdminSuggestionsViewModel();

  if (viewModel.loading && viewModel.rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (viewModel.error) {
    return <StyledErrorTypography>{tc("loadFailed")}</StyledErrorTypography>;
  }

  const {
    labels,
    summary,
    rows,
    searchQuery,
    activeTab,
    canManage,
    canDelete,
    loading,
    onSearchChange,
    onTabChange,
    onMarkReviewed,
    onRespond,
    onMarkDuplicate,
    onDelete,
    respondDialogOpen,
    isResponding,
    duplicateDialogOpen,
    markingDuplicateId,
    isMarkingDuplicate,
    deleteDialogOpen,
    isDeleting,
    dialogLabels,
    closeDeleteDialog,
    closeRespondDialog,
    closeDuplicateDialog,
    onRespondConfirm,
    onMarkDuplicateConfirm,
    onDeleteConfirm,
  } = viewModel;

  return (
    <RequirePermission permissions={[AppPermission.SuggestionsList]}>
      <AdminSuggestionsView
        labels={labels}
        summary={summary}
        rows={rows}
        searchQuery={searchQuery}
        activeTab={activeTab}
        canManage={canManage}
        canDelete={canDelete}
        loading={loading}
        onSearchChange={onSearchChange}
        onTabChange={onTabChange}
        onMarkReviewed={onMarkReviewed}
        onRespond={onRespond}
        onMarkDuplicate={onMarkDuplicate}
        onDelete={onDelete}
      />

      <SuggestionRespondDialog
        open={respondDialogOpen !== ""}
        suggestionId={respondDialogOpen}
        isLoading={isResponding}
        labels={dialogLabels}
        onConfirm={onRespondConfirm}
        onCancel={closeRespondDialog}
      />

      <SuggestionMarkDuplicateDialog
        open={duplicateDialogOpen}
        suggestionId={markingDuplicateId}
        isLoading={isMarkingDuplicate}
        labels={dialogLabels}
        onConfirm={onMarkDuplicateConfirm}
        onCancel={closeDuplicateDialog}
      />

      <Dialog open={deleteDialogOpen} onClose={() => closeDeleteDialog()} maxWidth="xs" fullWidth>
        <DialogTitle>{dialogLabels.deleteConfirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogLabels.deleteConfirmBody}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDeleteDialog()} disabled={isDeleting}>
            {dialogLabels.cancel}
          </Button>
          <Button onClick={onDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
            {dialogLabels.deleteConfirmAction}
          </Button>
        </DialogActions>
      </Dialog>
    </RequirePermission>
  );
}
