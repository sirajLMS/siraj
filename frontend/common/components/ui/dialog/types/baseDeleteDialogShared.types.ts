import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface BaseDeleteDialogSharedProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Accessible labelled-by id for the dialog title (wired to the Dialog's aria-labelledby). */
  dialogId?: string;
  /** Optional override for the confirm button sx (default uses error palette) */
  confirmSx?: SxProps<Theme>;
  /** Whether the dialog should be full-screen (mobile pattern). Defaults to false. */
  fullScreen?: boolean;
  /** Optional content slot rendered between the body and the action row (e.g. entity detail blocks inside confirm dialogs). */
  children?: ReactNode;
}

export interface DeleteDialogSlotProps {
  CancelActionButton: React.ComponentType<{
    fullWidth?: boolean;
    onClick: () => void;
    disabled?: boolean;
    sx?: SxProps<Theme>;
    children: ReactNode;
  }>;
  ConfirmActionButton: React.ComponentType<{
    fullWidth?: boolean;
    onClick: () => void;
    disabled?: boolean;
    sx?: SxProps<Theme>;
    children: ReactNode;
  }>;
}
