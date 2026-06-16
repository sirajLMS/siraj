"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { FilterButton, PrimaryPageAction } from "@/frontend/components/ui";
import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";

interface ResourceDeleteDialogProps {
  readonly labels: ResourcesLabels;
  readonly open: boolean;
  readonly resourceTitle: string | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function ResourceDeleteDialog({
  labels,
  open,
  resourceTitle,
  onCancel,
  onConfirm,
}: Readonly<ResourceDeleteDialogProps>) {
  const bodyText = resourceTitle
    ? labels.deleteDialog.body.replace("{title}", resourceTitle)
    : labels.deleteDialog.body.replace("{title}", "this resource");

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
        <Box
          sx={theme => ({
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: theme.palette.errorContainer,
            color: theme.palette.error.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          })}
        >
          <WarningAmberOutlined sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="headlineMd">{labels.deleteDialog.title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {bodyText}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <FilterButton fullWidth onClick={onCancel} sx={{ py: 1.5 }}>
          {labels.deleteDialog.cancel}
        </FilterButton>
        <PrimaryPageAction
          fullWidth
          onClick={onConfirm}
          sx={theme => ({
            py: 1.5,
            bgcolor: theme.palette.error.main,
            "&:hover": { bgcolor: theme.palette.error.dark },
          })}
        >
          {labels.deleteDialog.confirm}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
