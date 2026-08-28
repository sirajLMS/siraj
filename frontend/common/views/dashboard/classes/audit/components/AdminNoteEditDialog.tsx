"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { AdminNoteDialogLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export interface AdminNoteEditDialogProps {
  readonly open: boolean;
  readonly content: string;
  readonly isSaving: boolean;
  readonly labels: AdminNoteDialogLabels;
  readonly onContentChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

export function AdminNoteEditDialog({
  open,
  content,
  isSaving,
  labels,
  onContentChange,
  onClose,
  onSave,
}: Readonly<AdminNoteEditDialogProps>) {
  return (
    <Dialog {...DialogPresets.info} open={open} onClose={onClose}>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          label={labels.content}
          value={content}
          disabled={isSaving}
          onChange={event => onContentChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          {labels.cancel}
        </Button>
        <Button onClick={onSave} variant="contained" disabled={isSaving}>
          {labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
