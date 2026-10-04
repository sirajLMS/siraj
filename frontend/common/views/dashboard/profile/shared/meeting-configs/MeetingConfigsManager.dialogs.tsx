import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { MeetingConfigDeleteDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigDeleteDialog";
import { MeetingConfigFormDialog } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog";
import type { MeetingConfigsManagerState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.helpers";

interface MeetingConfigDialogsProps {
  readonly state: MeetingConfigsManagerState;
  readonly targetUserId: string;
  readonly existingCount: number;
  readonly fullScreenFormDialog: boolean;
  readonly savedMessage: string;
}

export function MeetingConfigDialogs({
  state,
  targetUserId,
  existingCount,
  fullScreenFormDialog,
  savedMessage,
}: Readonly<MeetingConfigDialogsProps>) {
  return (
    <>
      <MeetingConfigFormDialog
        open={state.formOpen}
        userId={targetUserId}
        editConfig={state.editConfig}
        existingCount={existingCount}
        labels={state.labels.manager}
        enhancementLabels={state.labels.enhancements}
        fullScreen={fullScreenFormDialog}
        onClose={state.closeForm}
        onSaved={state.handleSaved}
      />
      <MeetingConfigDeleteDialog
        open={state.deleteId != null}
        configLabel={state.deleteLabel}
        isLoading={state.deleting}
        labels={state.labels.manager}
        onClose={() => state.setDeleteId(null)}
        onConfirm={state.handleConfirmDelete}
      />
      <FormSuccessSnackbar
        open={state.showSuccess}
        message={savedMessage}
        onClose={() => state.setShowSuccess(false)}
      />
      <FormErrorSnackbar
        open={state.errorMessage != null}
        message={state.errorMessage ?? ""}
        onClose={() => state.setErrorMessage(null)}
      />
    </>
  );
}
