"use client";

import { useState } from "react";

import {
  ViewAsUserConfirmDialog,
  ViewAsUserTrigger,
  type ViewAsUserVariant,
} from "@/frontend/common/components/auth/ViewAsUserButton.parts";

import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";

import { usePermissionGroupSimulation } from "@/frontend/common/hooks/usePermissionGroupSimulation";

import { useUserStore } from "@/frontend/common/stores/userStore";

import { Translation, useAppTranslation } from "@/shared/locale";

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

  const handleConfirm = (reason?: string) => startImpersonation(targetUserId, reason);

  return (
    <>
      <ViewAsUserTrigger variant={variant} size={size} loginLabel={t.loginAs} onOpen={openDialog} />

      <ViewAsUserConfirmDialog
        open={isDialogOpen}
        targetUserName={targetUserName}
        loading={loading}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </>
  );
}
