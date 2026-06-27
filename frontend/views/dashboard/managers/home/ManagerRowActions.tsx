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
  Input,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UpdateManagerProfileInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { updateManagerProfileMutationDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import { logger } from "@/frontend/utils/logger";
import type { Manager } from "./types";

interface ManagerRowActionsProps {
  readonly manager: Manager;
}

const StyledEditField = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 0),
}));

async function executeManagerUpdate(
  updateProfile: (options: { readonly variables: { readonly staffProfileId: string; readonly input: UpdateManagerProfileInput } }) => Promise<unknown>,
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

export function ManagerRowActions({ manager }: Readonly<ManagerRowActionsProps>) {
  const t = useTranslations("dashboard.managersDirectory");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [editPhone, setEditPhone] = useState(manager.phone);
  const [editSkypeId, setEditSkypeId] = useState(manager.skypeId);

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
    setEditSkypeId(manager.skypeId);
    setEditDialogOpen(true);
  };

  const handleDeactivateClick = () => {
    handleMenuClose();
    setDeactivateDialogOpen(true);
  };

  const handleEditSubmit = () =>
    executeManagerUpdate(
      updateProfile,
      manager.id,
      { phone: editPhone || null, skypeId: editSkypeId || null } as UpdateManagerProfileInput,
      () => setEditDialogOpen(false),
      "Manager profile updated",
      { staffProfileId: manager.id }
    );

  const handleDeactivateSubmit = () => {
    const newStatus = manager.status === "active" ? "DEACTIVATED" : "ACTIVATED";
    return executeManagerUpdate(
      updateProfile,
      manager.id,
      { status: newStatus } as UpdateManagerProfileInput,
      () => setDeactivateDialogOpen(false),
      "Manager status updated",
      { staffProfileId: manager.id, newStatus }
    );
  };

  const isDeactivate = manager.status === "active";

  return (
    <>
      <IconButton size="small" aria-label={t("actions.options")} onClick={handleMenuOpen}>
        <SettingsOutlined fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>
          <EditOutlined fontSize="small" sx={theme => ({ mr: 1, color: theme.palette.text.secondary })} />
          {t("actions.editProfile")}
        </MenuItem>
        <MenuItem
          onClick={handleDeactivateClick}
          sx={theme => ({
            color: isDeactivate ? theme.palette.error.main : theme.palette.success.main,
          })}
        >
          <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
          {isDeactivate ? t("actions.deactivate") : t("actions.activate")}
        </MenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("actions.editProfile")}</DialogTitle>
        <DialogContent>
          <Typography variant="bodyMd" sx={theme => ({ mb: 2, color: theme.palette.text.secondary })}>
            {manager.name}
          </Typography>
          <StyledEditField>
            <Input
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              placeholder={t("fields.phone")}
              fullWidth
            />
            <Input
              value={editSkypeId ?? ""}
              onChange={e => setEditSkypeId(e.target.value)}
              placeholder={t("fields.skypeId")}
              fullWidth
            />
          </StyledEditField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>{t("actions.cancel")}</Button>
          <Button onClick={handleEditSubmit} variant="contained" disabled={updateLoading}>
            {updateLoading ? t("actions.processing") : t("actions.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{isDeactivate ? t("actions.deactivate") : t("actions.activate")}</DialogTitle>
        <DialogContent>
          <Typography variant="bodyMd">
            {isDeactivate
              ? t("actions.deactivateConfirmation", { name: manager.name })
              : t("actions.activateConfirmation", { name: manager.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>{t("actions.cancel")}</Button>
          <Button
            onClick={handleDeactivateSubmit}
            variant="contained"
            disabled={updateLoading}
            sx={theme => ({
              backgroundColor: isDeactivate ? theme.palette.error.main : theme.palette.success.main,
              "&:hover": {
                backgroundColor: isDeactivate ? theme.palette.error.dark : theme.palette.success.dark,
              },
            })}
          >
            {updateLoading ? t("actions.processing") : isDeactivate ? t("actions.deactivate") : t("actions.activate")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
