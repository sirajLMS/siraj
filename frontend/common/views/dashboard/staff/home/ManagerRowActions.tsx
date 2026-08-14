"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  type Theme,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { AccountStatus, type UpdateManagerProfileInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  managerDirectoryQueryDocument,
  updateManagerProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForUser } from "@/frontend/common/utils/profileHref";
import type { Manager } from "@/frontend/common/views/dashboard/staff/home/types";
import { useRouter } from "@/shared/i18n/navigation";
import type { StaffDirectoryLabels } from "@/shared/locale";

interface ManagerRowActionsProps {
  readonly labels: StaffDirectoryLabels;
  readonly manager: Manager;
}

async function executeManagerUpdate(
  updateProfile: (options: {
    readonly variables: { readonly staffProfileId: string; readonly input: UpdateManagerProfileInput };
  }) => Promise<unknown>,
  staffProfileId: string,
  input: UpdateManagerProfileInput,
  onSuccess: () => void,
  successMessage: string,
  logContext: Record<string, unknown>
) {
  try {
    await updateProfile({
      variables: {
        staffProfileId,
        input,
      },
    });
    onSuccess();
    logger.info(successMessage, logContext);
  } catch (error) {
    logger.error("Failed to update manager profile", { error });
  }
}

interface DeactivateDialogProps {
  readonly labels: StaffDirectoryLabels;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly isDeactivate: boolean;
  readonly manager: Manager;
  readonly updateLoading: boolean;
}

function resolveSubmitLabel(
  state: { readonly updateLoading: boolean; readonly isDeactivate: boolean },
  t: StaffDirectoryLabels["actions"]
): string {
  if (state.updateLoading) {
    return t.processing;
  }
  return state.isDeactivate ? t.deactivate : t.activate;
}

function DeactivateDialog({
  labels: t,
  open,
  onClose,
  onSubmit,
  isDeactivate,
  manager,
  updateLoading,
}: Readonly<DeactivateDialogProps>) {
  const actions = t.actions;

  const dialogTitle = isDeactivate ? actions.deactivate : actions.activate;
  const confirmationLabel = isDeactivate
    ? actions.deactivateConfirmation(manager.name)
    : actions.activateConfirmation(manager.name);
  const submitButtonSx = (theme: Theme) => {
    const baseColor = isDeactivate ? theme.palette.error : theme.palette.success;
    return {
      backgroundColor: baseColor.main,
      "&:hover": { backgroundColor: baseColor.dark },
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd">{confirmationLabel}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.actions.cancel}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={updateLoading} sx={submitButtonSx}>
          {resolveSubmitLabel({ updateLoading, isDeactivate }, t.actions)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ManagerRowActions({ labels, manager }: Readonly<ManagerRowActionsProps>) {
  const t = labels;
  const router = useRouter();
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const [updateProfile, { loading: updateLoading }] = useMutation(updateManagerProfileMutationDocument, {
    refetchQueries: [managerDirectoryQueryDocument],
  });

  const handleEditClick = () => {
    router.push(`${profileHrefForUser(manager.userId)}?tab=profile`);
  };

  const handleDeactivateClick = () => {
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateSubmit = () => {
    const newStatus = manager.status === "active" ? AccountStatus.Deactivated : AccountStatus.Activated;
    return executeManagerUpdate(
      updateProfile,
      manager.staffProfileId,
      { hourlyRate: null, name: null, email: null, phone: null, rateCurrency: null, status: newStatus },
      () => setDeactivateDialogOpen(false),
      "Manager status updated",
      { staffProfileId: manager.staffProfileId, newStatus }
    );
  };

  const isDeactivate = manager.status === "active";
  const deactivateLabel = isDeactivate ? t.actions.deactivate : t.actions.activate;

  return (
    <>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <ViewAsUserButton
          variant="icon"
          targetUserId={manager.userId}
          targetUserName={manager.name}
          targetIsSuperAdmin={manager.targetIsSuperAdmin}
        />

        <Tooltip title={t.actions.editProfile}>
          <IconButton size="small" onClick={handleEditClick} aria-label={t.actions.editProfile}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={deactivateLabel}>
          <IconButton
            size="small"
            onClick={handleDeactivateClick}
            aria-label={deactivateLabel}
            sx={theme => ({
              color: isDeactivate ? theme.palette.error.main : theme.palette.success.main,
            })}
          >
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <DeactivateDialog
        labels={labels}
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        onSubmit={handleDeactivateSubmit}
        isDeactivate={isDeactivate}
        manager={manager}
        updateLoading={updateLoading}
      />
    </>
  );
}
