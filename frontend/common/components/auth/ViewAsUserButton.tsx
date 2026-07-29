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

import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";

import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";

import { useUserStore } from "@/frontend/common/stores/userStore";

import { Translation, useAppTranslation } from "@/shared/locale";

type ViewAsUserVariant = "icon" | "link" | "menuItem" | "button";

interface ViewAsUserButtonProps {
  readonly targetUserId: string;

  readonly targetUserName: string;

  readonly targetIsSuperAdmin?: boolean;

  readonly size?: "small" | "medium";

  readonly variant?: ViewAsUserVariant;

  readonly onMenuClose?: () => void;

  readonly open?: boolean;

  readonly onClose?: () => void;
}

export function ViewAsUserButton({
  targetUserId,

  targetUserName,

  targetIsSuperAdmin = false,

  size = "small",

  variant = "icon",

  onMenuClose,

  open: externalOpen,

  onClose: externalOnClose,
}: ViewAsUserButtonProps) {
  const t = useAppTranslation(Translation.Auth.Impersonation);

  const currentUser = useUserStore(state => state.user);

  const actorIsSuperAdmin = useUserStore(state => state.actorIsSuperAdmin);

  const { isImpersonating, startImpersonation, loading } = useImpersonation();

  const { isSimulatingGroup } = usePermissionGroupSimulation();

  const [internalOpen, setInternalOpen] = useState(false);

  const [reason, setReason] = useState("");

  const isControlled = typeof externalOpen === "boolean";

  const isDialogOpen = isControlled ? externalOpen : internalOpen;

  const handleClose = () => {
    if (isControlled) {
      externalOnClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  const isSuperAdmin = actorIsSuperAdmin || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "super_admin";

  const isSelf = currentUser?.id === targetUserId;

  if (!isSuperAdmin || isSelf || targetIsSuperAdmin || isImpersonating || isSimulatingGroup) {
    return null;
  }

  const openDialog = () => {
    onMenuClose?.();

    if (!isControlled) {
      setInternalOpen(true);
    }
  };

  const handleConfirm = async () => {
    const success = await startImpersonation(targetUserId, reason.trim() || undefined);

    if (success) {
      handleClose();

      setReason("");
    }
  };

  const loginLabel = t.loginAs;

  function renderTrigger() {
    if (isControlled && !variant) {
      return null;
    }

    if (variant === "menuItem") {
      return (
        <MenuItem onClick={openDialog}>
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
          onClick={openDialog}
          sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
        >
          {loginLabel}
        </Link>
      );
    }

    if (variant === "button") {
      return (
        <Button variant="outlined" size={size} startIcon={<LoginOutlined />} onClick={openDialog}>
          {loginLabel}
        </Button>
      );
    }

    if (variant === "icon") {
      return (
        <Tooltip title={loginLabel}>
          <IconButton size={size} onClick={openDialog} aria-label={loginLabel}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return null;
  }

  const trigger = renderTrigger();

  return (
    <>
      {trigger}

      <Dialog open={isDialogOpen} onClose={handleClose} fullWidth maxWidth="xs">
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
          <Button onClick={handleClose} disabled={loading}>
            {t.cancel}
          </Button>

          <Button variant="contained" onClick={() => void handleConfirm()} disabled={loading}>
            {t.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
