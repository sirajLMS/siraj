"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Button, Stack } from "@mui/material";
import { ErrorState, FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { MeetingConfigList } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { MeetingConfigDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";
import { MeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
import { useMeetingConfigsManagerViewModel } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel";

export type MeetingConfigsManagerProps = {
  readonly targetUserId: string;
  readonly canManage: boolean;
};

function AddConfigButton({ onClick, label }: { readonly onClick: () => void; readonly label: string }) {
  return (
    <Stack sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
      <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={onClick}>
        {label}
      </Button>
    </Stack>
  );
}

type MeetingConfigDialogsProps = {
  readonly targetUserId: string;
  readonly editConfig: UserMeetingConfigFieldsFragment | null;
  readonly formOpen: boolean;
  readonly deleteId: string | null;
  readonly deleteLabel: string;
  readonly deleting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly existingCount: number;
  readonly onCloseForm: () => void;
  readonly onSaved: () => void;
  readonly onCloseDelete: () => void;
  readonly onConfirmDelete: () => void;
  readonly onCloseSuccess: () => void;
  readonly onCloseError: () => void;
  readonly successMessage: string;
  readonly managerLabels: ReturnType<typeof useMeetingConfigsManagerViewModel>["labels"]["manager"];
};

function MeetingConfigDialogs({
  targetUserId,
  editConfig,
  formOpen,
  deleteId,
  deleteLabel,
  deleting,
  showSuccess,
  errorMessage,
  existingCount,
  onCloseForm,
  onSaved,
  onCloseDelete,
  onConfirmDelete,
  onCloseSuccess,
  onCloseError,
  successMessage,
  managerLabels,
}: MeetingConfigDialogsProps) {
  return (
    <>
      <MeetingConfigFormDialog
        open={formOpen}
        userId={targetUserId}
        editConfig={editConfig}
        existingCount={existingCount}
        labels={managerLabels}
        onClose={onCloseForm}
        onSaved={onSaved}
      />

      <MeetingConfigDeleteDialog
        open={deleteId != null}
        configLabel={deleteLabel}
        isLoading={deleting}
        labels={managerLabels}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
      />

      <FormSuccessSnackbar open={showSuccess} message={successMessage} onClose={onCloseSuccess} />
      <FormErrorSnackbar open={errorMessage != null} message={errorMessage ?? ""} onClose={onCloseError} />
    </>
  );
}

export function MeetingConfigsManager({ targetUserId, canManage }: MeetingConfigsManagerProps) {
  const state = useMeetingConfigsManagerViewModel({ targetUserId });
  const { t, configs, loading, error, refetch } = state;

  if (error && configs.length === 0) {
    return (
      <ErrorState
        embedded
        message={t.loadError}
        retryLabel={t.retry}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const busy = loading || state.deleting || state.settingDefault;

  return (
    <Stack spacing={2}>
      {canManage ? <AddConfigButton onClick={state.openCreateForm} label={t.add} /> : null}

      <MeetingConfigList
        configs={configs}
        loading={busy}
        title={t.listTitle}
        emptyMessage={loading ? undefined : t.empty}
        onEditAction={canManage ? state.openEditForm : undefined}
        onDeleteAction={canManage ? state.setDeleteId : undefined}
        onSetDefaultAction={canManage ? state.handleSetDefault : undefined}
      />

      <MeetingConfigDialogs
        targetUserId={targetUserId}
        editConfig={state.editConfig}
        formOpen={state.formOpen}
        deleteId={state.deleteId}
        deleteLabel={state.deleteLabel}
        deleting={state.deleting}
        showSuccess={state.showSuccess}
        errorMessage={state.errorMessage}
        existingCount={configs.length}
        onCloseForm={state.closeForm}
        onSaved={state.handleSaved}
        onCloseDelete={() => state.setDeleteId(null)}
        onConfirmDelete={state.handleConfirmDelete}
        onCloseSuccess={() => state.setShowSuccess(false)}
        onCloseError={() => state.setErrorMessage(null)}
        successMessage={t.saved}
        managerLabels={state.labels.manager}
      />
    </Stack>
  );
}
