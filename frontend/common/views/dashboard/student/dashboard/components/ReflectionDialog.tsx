"use client";

import { useMutation } from "@apollo/client/react";
import { Alert, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import { submitStudentReflectionMutationDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { useStudentDashboardStore } from "@/frontend/common/stores/studentDashboardStore";
import { logger } from "@/frontend/common/utils/logger";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";

type ReflectionDialogProps = Pick<StudentDashboardViewModel, "labels" | "commonLabels">;

/**
 * Self-contained dialog for submitting a student lesson reflection.
 * Reads `reflectionDialogOpen` / `selectedReportId` from the dashboard store.
 * `selectedReportId` holds the `classInstanceId` required by the mutation.
 */
export function ReflectionDialog({ labels, commonLabels }: Readonly<ReflectionDialogProps>) {
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
      setError(labels.reflectionSaveError);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ typography: "titleLg" }}>{labels.reflectionDialogTitle}</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          
          fullWidth
          multiline
          minRows={4}
          label={labels.reflectionNotesLabel}
          placeholder={labels.reflectionNotesPlaceholder}
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
          {commonLabels.cancel}
        </FilterButton>
        <PrimaryPageAction
          onClick={() => {
            void handleSave();
          }}
          disabled={loading || notes.trim().length === 0 || !classInstanceId}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {commonLabels.save}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
