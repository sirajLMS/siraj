"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteOutlined, EditOutlined, SettingsOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  type Theme,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { PhoneInput } from "@/frontend/common/components/ui/input";
import type { UpdateManagerProfileInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { updateManagerProfileMutationDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";
import { logger } from "@/frontend/common/utils/logger";
import type { Manager } from "@/frontend/common/views/dashboard/managers/home/types";

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
  const t = useTranslations("dashboard.managersDirectory");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("actions.editProfile")}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ mb: 2, color: theme.palette.text.secondary })}>
          {manager.name}
        </Typography>
        <StyledEditField>
          <PhoneInput
            value={editPhone || null}
            onChangeAction={value => onPhoneChange(value ?? "")}
            label={t("fields.phone")}
            fullWidth
          />
        </StyledEditField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("actions.cancel")}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={updateLoading}>
          {updateLoading ? t("actions.processing") : t("actions.save")}
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

type TranslatorFn = ReturnType<typeof useTranslations>;

function resolveSubmitLabel(
  state: { readonly updateLoading: boolean; readonly isDeactivate: boolean },
  t: TranslatorFn
): string {
  if (state.updateLoading) {
    return t("actions.processing");
  }
  return state.isDeactivate ? t("actions.deactivate") : t("actions.activate");
}

function DeactivateDialog({
  open,
  onClose,
  onSubmit,
  isDeactivate,
  manager,
  updateLoading,
}: Readonly<DeactivateDialogProps>) {
  const t = useTranslations("dashboard.managersDirectory");

  const dialogTitle = isDeactivate ? t("actions.deactivate") : t("actions.activate");
  const confirmationLabel = isDeactivate
    ? t("actions.deactivateConfirmation", { name: manager.name })
    : t("actions.activateConfirmation", { name: manager.name });
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
        <Button onClick={onClose}>{t("actions.cancel")}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={updateLoading} sx={submitButtonSx}>
          {resolveSubmitLabel({ updateLoading, isDeactivate }, t)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ActionMenuProps {
  readonly anchorEl: HTMLElement | null;
  readonly menuOpen: boolean;
  readonly onMenuClose: () => void;
  readonly onEditClick: () => void;
  readonly onDeactivateClick: () => void;
  readonly manager: Manager;
  readonly isDeactivate: boolean;
}

function ActionMenu({
  anchorEl,
  menuOpen,
  onMenuClose,
  onEditClick,
  onDeactivateClick,
  manager,
  isDeactivate,
}: Readonly<ActionMenuProps>) {
  const t = useTranslations("dashboard.managersDirectory");

  return (
    <Menu anchorEl={anchorEl} open={menuOpen} onClose={onMenuClose}>
      <ViewAsUserButton
        variant="menuItem"
        targetUserId={manager.userId}
        targetUserName={manager.name}
        targetIsSuperAdmin={manager.targetIsSuperAdmin}
        onMenuClose={onMenuClose}
      />
      <MenuItem onClick={onEditClick}>
        <EditOutlined fontSize="small" sx={theme => ({ mr: 1, color: theme.palette.text.secondary })} />
        {t("actions.editProfile")}
      </MenuItem>
      <MenuItem
        onClick={onDeactivateClick}
        sx={theme => ({
          color: isDeactivate ? theme.palette.error.main : theme.palette.success.main,
        })}
      >
        <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
        {isDeactivate ? t("actions.deactivate") : t("actions.activate")}
      </MenuItem>
    </Menu>
  );
}

export function ManagerRowActions({ manager }: Readonly<ManagerRowActionsProps>) {
  const t = useTranslations("dashboard.managersDirectory");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [editPhone, setEditPhone] = useState(manager.phone);

  const [updateProfile, { loading: updateLoading }] = useMutation(updateManagerProfileMutationDocument);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setEditPhone(manager.phone);
    setEditDialogOpen(true);
  };

  const handleDeactivateClick = () => {
    handleMenuClose();
    setDeactivateDialogOpen(true);
  };

  const handleEditSubmit = () =>
    executeManagerUpdate(
      updateProfile,
      manager.staffProfileId,
      { phone: editPhone || null, status: null, hourlyRate: null, rateCurrency: null },
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

  return (
    <>
      <IconButton size="small" aria-label={t("actions.options")} onClick={handleMenuOpen}>
        <SettingsOutlined fontSize="small" />
      </IconButton>

      <ActionMenu
        anchorEl={anchorEl}
        menuOpen={menuOpen}
        onMenuClose={handleMenuClose}
        onEditClick={handleEditClick}
        onDeactivateClick={handleDeactivateClick}
        manager={manager}
        isDeactivate={isDeactivate}
      />

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
