"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { MobileFilterButton, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export interface DeleteEntityDialogSharedProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isLoading: boolean;
  readonly entityName: string;
  readonly titleId: string;
  readonly title: string;
  readonly cancelLabel: string;
  readonly confirmMessage: (name: string) => string;
}

const ICON_CONTAINER_SX = (theme: import("@mui/material").Theme) => ({
  width: 64,
  height: 64,
  borderRadius: "50%",
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.error.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  mb: 2,
});

const CONFIRM_SX = (theme: import("@mui/material").Theme) => ({
  color: theme.palette.text.secondary,
  textAlign: "center",
});

const DELETE_BUTTON_SX = (theme: import("@mui/material").Theme) => ({
  py: 1.5,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
  "&:hover": { backgroundColor: theme.palette.error.dark },
});

const ACTIONS_SX = { px: 3, pb: 3, gap: 1 } as const;
const TITLE_SX = { pt: 4, display: "flex", flexDirection: "column", alignItems: "center" } as const;

export function DeleteEntityDialogShared({
  open,
  onClose,
  onConfirm,
  isLoading,
  entityName,
  titleId,
  title,
  cancelLabel,
  confirmMessage,
}: Readonly<DeleteEntityDialogSharedProps>) {
  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullScreen aria-labelledby={titleId}>
      <DialogTitle id={titleId} sx={TITLE_SX}>
        <Box sx={ICON_CONTAINER_SX}>
          <WarningAmberOutlined sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="headlineMd">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={CONFIRM_SX}>
          {confirmMessage(entityName)}
        </Typography>
      </DialogContent>
      <DialogActions sx={ACTIONS_SX}>
        <MobileFilterButton fullWidth onClick={onClose} disabled={isLoading} sx={{ py: 1.5 }}>
          {cancelLabel}
        </MobileFilterButton>
        <MobilePrimaryPageAction fullWidth onClick={onConfirm} disabled={isLoading} sx={DELETE_BUTTON_SX}>
          {isLoading ? "..." : title}
        </MobilePrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
