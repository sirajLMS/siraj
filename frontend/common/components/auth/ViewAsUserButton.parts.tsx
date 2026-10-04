"use client";

import { LoginOutlined, VisibilityOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";

import { Translation, useAppTranslation } from "@/shared/locale";

export type ViewAsUserVariant = "icon" | "link" | "menuItem" | "button";

interface ViewAsUserTriggerProps {
  readonly variant: ViewAsUserVariant;
  readonly size: "small" | "medium";
  readonly loginLabel: string;
  readonly onOpen: () => void;
}

export function ViewAsUserTrigger({
  variant,
  size,
  loginLabel,
  onOpen,
}: Readonly<ViewAsUserTriggerProps>): React.ReactNode {
  if (variant === "menuItem") {
    return (
      <MenuItem onClick={onOpen}>
        <LoginOutlined fontSize="small" sx={{ mr: 1 }} />
        {loginLabel}
      </MenuItem>
    );
  }

  if (variant === "link") {
    return (
      <Link
        component="button"
        type="button"
        variant="bodyMd"
        underline="hover"
        onClick={onOpen}
        sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
      >
        {loginLabel}
      </Link>
    );
  }

  if (variant === "button") {
    return (
      <Button variant="outlined" size={size} startIcon={<LoginOutlined />} onClick={onOpen}>
        {loginLabel}
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Tooltip title={loginLabel}>
        <IconButton size={size} onClick={onOpen} aria-label={loginLabel}>
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return null;
}

interface ViewAsUserConfirmDialogProps {
  readonly open: boolean;
  readonly targetUserName: string;
  readonly loading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason?: string) => Promise<boolean>;
}

export function ViewAsUserConfirmDialog({
  open,
  targetUserName,
  loading,
  onClose,
  onConfirm,
}: Readonly<ViewAsUserConfirmDialogProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Auth.Impersonation);
  const [reason, setReason] = useState("");

  const closeAndClear = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    const success = await onConfirm(reason.trim() || undefined);
    if (success) {
      closeAndClear();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t.confirmTitle(targetUserName)}</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {t.confirmMessage}

        <TextField
          label={t.reasonLabel}
          placeholder={t.reasonPlaceholder}
          value={reason}
          onChange={e => setReason(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t.cancel}
        </Button>

        <Button variant="contained" onClick={() => void handleConfirm()} disabled={loading}>
          {t.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
