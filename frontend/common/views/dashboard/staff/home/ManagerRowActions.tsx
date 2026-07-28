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
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { PhoneInput } from "@/frontend/common/components/ui/input";
import type { UpdateManagerProfileInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  managerDirectoryQueryDocument,
  updateManagerProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";
import { logger } from "@/frontend/common/utils/logger";
import type { Manager } from "@/frontend/common/views/dashboard/staff/home/types";
import type { StaffDirectoryLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

interface ManagerRowActionsProps {
  readonly manager: Manager;
}

const StyledEditField = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 0),
}));

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

interface EditProfileDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly manager: Manager;
  readonly editPhone: string;
  readonly onPhoneChange: (value: string) => void;
  readonly updateLoading: boolean;
}

function EditProfileDialog({
  open,
  onClose,
  onSubmit,
  manager,
  editPhone,
  onPhoneChange,
  updateLoading,
}: Readonly<EditProfileDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.staffDirectory;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t.actions.editProfile}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ mb: 2, color: theme.palette.text.secondary })}>
          {manager.name}
        </Typography>
        <StyledEditField>
          <PhoneInput
            value={editPhone || null}
            onChangeAction={value => onPhoneChange(value ?? "")}
            label={t.fields.phone}
            fullWidth
          />
        </StyledEditField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.actions.cancel}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={updateLoading}>
          {updateLoading ? t.actions.processing : t.actions.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface DeactivateDialogProps {
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
  open,
  onClose,
  onSubmit,
  isDeactivate,
  manager,
  updateLoading,
}: Readonly<DeactivateDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.staffDirectory;
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

export function ManagerRowActions({ manager }: Readonly<ManagerRowActionsProps>) {
  const t = useAppTranslation().dashboardTranslations.staffDirectory;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [editPhone, setEditPhone] = useState(manager.phone);

  const [updateProfile, { loading: updateLoading }] = useMutation(updateManagerProfileMutationDocument, {
    refetchQueries: [managerDirectoryQueryDocument],
  });

  const handleEditClick = () => {
    setEditPhone(manager.phone);
    setEditDialogOpen(true);
  };

  const handleDeactivateClick = () => {
    setDeactivateDialogOpen(true);
  };

  const handleEditSubmit = () =>
    executeManagerUpdate(
      updateProfile,
      manager.staffProfileId,
      { phone: editPhone || null } as unknown as UpdateManagerProfileInput,
      () => setEditDialogOpen(false),
      "Manager profile updated",
      { staffProfileId: manager.staffProfileId }
    );

  const handleDeactivateSubmit = () => {
    const newStatus = manager.status === "active" ? "DEACTIVATED" : "ACTIVATED";
    return executeManagerUpdate(
      updateProfile,
      manager.staffProfileId,
      { status: newStatus } as UpdateManagerProfileInput,
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

      <EditProfileDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        manager={manager}
        editPhone={editPhone}
        onPhoneChange={setEditPhone}
        updateLoading={updateLoading}
      />

      <DeactivateDialog
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
