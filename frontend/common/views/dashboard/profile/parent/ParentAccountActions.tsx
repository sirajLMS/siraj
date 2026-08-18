"use client";

import { Button, Stack, type Theme } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ParentAccountActionsProps,
  useParentAccountActionsViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useParentAccountActionsViewModel";

const reactivateConfirmSx = (theme: Theme) =>
  ({
    py: 1.5,
    backgroundColor: theme.palette.success.main,
    color: theme.palette.onSuccess,
    "&:hover": { backgroundColor: theme.palette.success.dark },
  }) as const;

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

  const isDeactivate = dialogMode === "deactivate";
  const dialogTitle = isDeactivate ? t.deactivateDialogTitle : t.reactivateDialogTitle;
  const confirmText = isDeactivate ? t.deactivateConfirmText : t.reactivateConfirmText;
  const confirmLabel = (() => {
    if (isLoading) {
      return isDeactivate ? t.deactivating : t.reactivating;
    }
    return isDeactivate ? t.deactivateAccount : t.reactivateAccount;
  })();

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
        <BaseDeleteDialog
          open
          onClose={closeDialog}
          onConfirm={handleConfirm}
          isLoading={isLoading}
          title={dialogTitle}
          body={confirmText}
          cancelLabel={t.cancel}
          confirmLabel={confirmLabel}
          confirmSx={isDeactivate ? undefined : reactivateConfirmSx}
        />
      ) : null}

      <FormSuccessSnackbar
        open={Boolean(successMessage)}
        message={successMessage ?? ""}
        onClose={clearSuccessMessage}
      />
      <FormErrorSnackbar open={Boolean(mutationError)} message={mutationError ?? ""} onClose={clearMutationError} />
    </RequirePermission>
  );
}
