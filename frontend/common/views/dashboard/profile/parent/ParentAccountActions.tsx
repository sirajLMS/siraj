"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentAccountActionsLabels } from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import {
  type ParentAccountActionsProps,
  useParentAccountActionsViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useParentAccountActionsViewModel";

type AccountActionDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly mode: "deactivate" | "reactivate";
  readonly labels: ParentAccountActionsLabels;
};

function AccountActionDialog({ open, onClose, onConfirm, loading, error, mode, labels: t }: AccountActionDialogProps) {
  const isDeactivate = mode === "deactivate";

  const dialogTitle = isDeactivate ? t.deactivateDialogTitle : t.reactivateDialogTitle;
  const confirmText = isDeactivate ? t.deactivateConfirmText : t.reactivateConfirmText;
  const buttonColor = isDeactivate ? "error" : "success";
  let buttonText: string;
  if (loading) {
    buttonText = isDeactivate ? t.deactivating : t.reactivating;
  } else {
    buttonText = isDeactivate ? t.deactivateAccount : t.reactivateAccount;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd">{confirmText}</Typography>
        {error ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main, mt: 2 })}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t.cancel}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={buttonColor} disabled={loading}>
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ParentAccountActions(props: Readonly<ParentAccountActionsProps>) {
  const {
    labels,
    dialogMode,
    successMessage,
    mutationError,
    isActivated,
    isLoading,
    openDeactivateDialog,
    openReactivateDialog,
    closeDialog,
    handleConfirm,
    clearSuccessMessage,
    clearMutationError,
  } = useParentAccountActionsViewModel(props);
  const t = labels;

  return (
    <RequirePermission permissions={[AppPermission.ParentManageStatus]}>
      <Stack direction="row" spacing={1}>
        {isActivated ? (
          <Button variant="outlined" color="error" onClick={openDeactivateDialog}>
            {t.deactivateAccount}
          </Button>
        ) : (
          <Button variant="outlined" color="success" onClick={openReactivateDialog}>
            {t.reactivateAccount}
          </Button>
        )}
      </Stack>

      {dialogMode ? (
        <AccountActionDialog
          open
          onClose={closeDialog}
          onConfirm={handleConfirm}
          loading={isLoading}
          error={mutationError}
          mode={dialogMode}
          labels={labels}
        />
      ) : null}

      <FormSuccessSnackbar
        open={Boolean(successMessage)}
        message={successMessage ?? ""}
        onClose={clearSuccessMessage}
      />
      <FormErrorSnackbar
        open={Boolean(mutationError) && !dialogMode}
        message={mutationError ?? ""}
        onClose={clearMutationError}
      />
    </RequirePermission>
  );
}
