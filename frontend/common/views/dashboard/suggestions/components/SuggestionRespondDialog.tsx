"use client";

import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { SuggestionRespondDialogProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionRespondDialog({
  open,
  suggestionId,
  isLoading,
  labels,
  onConfirm,
  onCancel,
}: Readonly<SuggestionRespondDialogProps>) {
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (!open) {
      setResponse("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (response.trim().length === 0) return;
    onConfirm(suggestionId, response.trim());
  };

  const handleCancel = () => {
    setResponse("");
    onCancel();
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{labels.respondTitle}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          minRows={4}
          placeholder={labels.respondPlaceholder}
          value={response}
          onChange={event => {
            setResponse(event.target.value);
          }}
          disabled={isLoading}
          sx={{ mt: 1 }}
          slotProps={{ htmlInput: { autoComplete: "off" } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <FilterButton onClick={handleCancel} disabled={isLoading}>
          {labels.cancel}
        </FilterButton>
        <PrimaryPageAction onClick={handleSubmit} disabled={isLoading || response.trim().length === 0}>
          {isLoading ? "..." : labels.respondAction}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
