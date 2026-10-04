import { Dialog, Stack, TextField, Typography } from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog/BaseFormDialogSection";
import type { WhatsappGroupsDetailLabels } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

interface GroupDetailDialogsProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly commonLabels: Readonly<{ cancel: string }>;
  readonly removeParticipantOpen: boolean;
  readonly removingParticipant: boolean;
  readonly removeParticipantWaId: string;
  readonly removeParticipantValid: boolean;
  readonly onRemoveParticipantWaIdChange: (value: string) => void;
  readonly onCloseRemoveParticipant: () => void;
  readonly onConfirmRemoveParticipant: () => void;
  readonly deleteOpen: boolean;
  readonly deleting: boolean;
  readonly onCloseDelete: () => void;
  readonly onConfirmDelete: () => void;
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly onCloseReset: () => void;
  readonly onConfirmReset: () => void;
}

export function GroupDetailDialogs({
  labels,
  commonLabels,
  removeParticipantOpen,
  removingParticipant,
  removeParticipantWaId,
  removeParticipantValid,
  onRemoveParticipantWaIdChange,
  onCloseRemoveParticipant,
  onConfirmRemoveParticipant,
  deleteOpen,
  deleting,
  onCloseDelete,
  onConfirmDelete,
  resetOpen,
  resetting,
  onCloseReset,
  onConfirmReset,
}: Readonly<GroupDetailDialogsProps>) {
  return (
    <>
      <Dialog
        open={removeParticipantOpen}
        onClose={onCloseRemoveParticipant}
        fullWidth
        maxWidth="xs"
        aria-labelledby="remove-participant-dialog"
      >
        <BaseFormDialogSection
          title={labels.removeParticipant}
          titleId="remove-participant-dialog"
          onClose={onCloseRemoveParticipant}
          onConfirm={onConfirmRemoveParticipant}
          isLoading={removingParticipant}
          cancelLabel={commonLabels.cancel}
          confirmLabel={labels.removeParticipant}
        >
          <Stack spacing={2}>
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {labels.removeParticipantConfirm}
            </Typography>
            <TextField
              size="small"
              label={labels.participantsTitle}
              value={removeParticipantWaId}
              onChange={event => onRemoveParticipantWaIdChange(event.target.value)}
              slotProps={{ htmlInput: { dir: "ltr" } }}
              aria-invalid={!removeParticipantValid}
              fullWidth
            />
          </Stack>
        </BaseFormDialogSection>
      </Dialog>
      <BaseDeleteDialog
        open={deleteOpen}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        isLoading={deleting}
        title={labels.deleteGroup}
        body={labels.deleteGroupWarning}
        cancelLabel={commonLabels.cancel}
        confirmLabel={labels.deleteGroupConfirm}
        dialogId="delete-group-dialog"
      />
      <BaseDeleteDialog
        open={resetOpen}
        onClose={onCloseReset}
        onConfirm={onConfirmReset}
        isLoading={resetting}
        title={labels.resetInviteLink}
        body={labels.resetInviteLinkWarning}
        cancelLabel={commonLabels.cancel}
        confirmLabel={labels.resetInviteLink}
        dialogId="reset-invite-link-dialog"
      >
        {labels.resetInviteLinkConfirm}
      </BaseDeleteDialog>
    </>
  );
}
