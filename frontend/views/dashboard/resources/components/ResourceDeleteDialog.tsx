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
  readonly loading?: boolean;
}

export function ResourceDeleteDialog({
  labels,
  open,
  resourceTitle,
  onCancel,
  onConfirm,
  loading = false,
}: Readonly<ResourceDeleteDialogProps>) {
  const bodyText = resourceTitle
    ? labels.deleteDialog.body.replace("{title}", resourceTitle)
    : labels.deleteDialog.body.replace("{title}", "this resource");

  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box
          sx={theme => ({
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: theme.palette.errorContainer,
            color: theme.palette.error.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
        <FilterButton fullWidth onClick={onCancel} disabled={loading} sx={{ py: 1.5 }}>
          {labels.deleteDialog.cancel}
        </FilterButton>
        <PrimaryPageAction
          fullWidth
          onClick={onConfirm}
          disabled={loading}
          sx={theme => ({
            py: 1.5,
            backgroundColor: theme.palette.error.main,
            "&:hover": { backgroundColor: theme.palette.error.dark },
          })}
        >
          {loading ? "..." : labels.deleteDialog.confirm}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
