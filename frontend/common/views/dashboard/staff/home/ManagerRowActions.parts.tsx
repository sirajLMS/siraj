import type { Theme } from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { Manager } from "@/frontend/common/views/dashboard/staff/home/types";
import type { StaffDirectoryLabels } from "@/shared/locale";

interface DeactivateDialogProps {
  readonly labels: StaffDirectoryLabels;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly isDeactivate: boolean;
  readonly manager: Manager;
  readonly updateLoading: boolean;
}

const activateConfirmSx = (theme: Theme) =>
  ({
    py: 1.5,
    backgroundColor: theme.palette.success.main,
    color: theme.palette.onSuccess,
    "&:hover": { backgroundColor: theme.palette.success.dark },
  }) as const;

export function DeactivateDialog({
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

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onSubmit}
      isLoading={updateLoading}
      title={dialogTitle}
      body={confirmationLabel}
      cancelLabel={actions.cancel}
      confirmLabel={isDeactivate ? actions.deactivate : actions.activate}
      confirmSx={isDeactivate ? undefined : activateConfirmSx}
    />
  );
}
