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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useImpersonation } from "@/frontend/hooks/useImpersonation";
import { usePermissionGroupSimulation } from "@/frontend/hooks/usePermissionGroupSimulation";
import { useUserStore } from "@/frontend/stores/userStore";

type ViewAsUserVariant = "icon" | "link" | "menuItem" | "button";

interface ViewAsUserButtonProps {
  readonly targetUserId: string;
  readonly targetUserName: string;
  readonly targetIsSuperAdmin?: boolean;
  readonly size?: "small" | "medium";
  readonly variant?: ViewAsUserVariant;
  readonly onMenuClose?: () => void;
}

export function ViewAsUserButton({
  targetUserId,
  targetUserName,
  targetIsSuperAdmin = false,
  size = "small",
  variant = "icon",
  onMenuClose,
}: ViewAsUserButtonProps) {
  const t = useTranslations("auth.impersonation");
  const currentUser = useUserStore(state => state.user);
  const { isImpersonating, startImpersonation, loading } = useImpersonation();
  const { isSimulatingGroup } = usePermissionGroupSimulation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isSelf = currentUser?.id === targetUserId;

  if (!isSuperAdmin || isSelf || targetIsSuperAdmin || isImpersonating || isSimulatingGroup) {
    return null;
  }

  const openDialog = () => {
    onMenuClose?.();
    setOpen(true);
  };

  const handleConfirm = async () => {
    const success = await startImpersonation(targetUserId, reason.trim() || undefined);
    if (success) {
      setOpen(false);
      setReason("");
    }
  };

  const trigger =
    variant === "menuItem" ? (
      <MenuItem onClick={openDialog}>
        <LoginOutlined fontSize="small" sx={{ mr: 1 }} />
        {t("loginAs")}
      </MenuItem>
    ) : variant === "link" ? (
      <Link
        component="button"
        type="button"
        variant="bodyMd"
        underline="hover"
        onClick={openDialog}
        sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
      >
        {t("loginAs")}
      </Link>
    ) : variant === "button" ? (
      <Button variant="outlined" size={size} startIcon={<LoginOutlined />} onClick={openDialog}>
        {t("loginAs")}
      </Button>
    ) : (
      <Tooltip title={t("loginAs")}>
        <IconButton size={size} onClick={openDialog} aria-label={t("loginAs")}>
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("confirmTitle", { name: targetUserName })}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {t("confirmMessage")}
          <TextField
            label={t("reasonLabel")}
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={e => setReason(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={() => void handleConfirm()} disabled={loading}>
            {t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
