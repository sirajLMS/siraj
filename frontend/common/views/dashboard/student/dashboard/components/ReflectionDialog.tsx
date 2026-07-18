"use client";

import { useMutation } from "@apollo/client/react";
import { Alert, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import { submitStudentReflectionMutationDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale";

/**
 * Self-contained dialog for submitting a student lesson reflection.
 * Reads `reflectionDialogOpen` / `selectedReportId` from the dashboard store.
 * `selectedReportId` holds the `classInstanceId` required by the mutation.
 */
export function ReflectionDialog() {
  const t = useAppTranslation().dashboardTranslations.studentPortalDashboard;
  const common = useAppTranslation().commonTranslations;

  const open = useStudentDashboardStore(state => state.reflectionDialogOpen);
  const classInstanceId = useStudentDashboardStore(state => state.selectedReportId);
  const setReflectionDialogOpen = useStudentDashboardStore(state => state.setReflectionDialogOpen);
  const setSelectedReportId = useStudentDashboardStore(state => state.setSelectedReportId);

  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [submitReflection, { loading }] = useMutation(submitStudentReflectionMutationDocument, {
    onError: err => {
      logger.error("Submit student reflection failed:", { err });
    },
  });

  useEffect(() => {
    if (open) {
      setNotes("");
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    setReflectionDialogOpen(false);
    setSelectedReportId(null);
    setNotes("");
    setError(null);
  };

  const handleSave = async () => {
    const trimmed = notes.trim();
    if (!classInstanceId || trimmed.length === 0) return;

    setError(null);
    try {
      await submitReflection({
        variables: {
          classInstanceId,
          studentNotes: trimmed,
        },
      });
      setReflectionDialogOpen(false);
      setSelectedReportId(null);
      setNotes("");
    } catch (err) {
      logger.error("Submit student reflection mutation failed:", { err });
      setError(t.reflectionSaveError);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ typography: "titleLg" }}>{t.reflectionDialogTitle}</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          label={t.reflectionNotesLabel}
          placeholder={t.reflectionNotesPlaceholder}
          value={notes}
          onChange={event => {
            setNotes(event.target.value);
          }}
          disabled={loading}
          sx={{ mt: 1 }}
          slotProps={{ htmlInput: { autoComplete: "off" } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <FilterButton onClick={handleClose} disabled={loading}>
          {common.cancel}
        </FilterButton>
        <PrimaryPageAction
          onClick={() => {
            void handleSave();
          }}
          disabled={loading || notes.trim().length === 0 || !classInstanceId}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {common.save}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
