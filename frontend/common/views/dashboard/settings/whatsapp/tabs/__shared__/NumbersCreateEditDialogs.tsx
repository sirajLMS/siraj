"use client";

import { CreateAccountDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog";
import { EditNameDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/editNameDialog";
import type {
  WhatsappCreateInput,
  WhatsappDialogState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersCreateEditDialogs({
  labels,
  dialogState,
  creating,
  updatingId,
  mutationError,
  onCreate,
  onEditName,
  onCloseDialog,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly dialogState: WhatsappDialogState;
  readonly creating: boolean;
  readonly updatingId: string | null;
  readonly mutationError: string | null;
  readonly onCreate: (input: WhatsappCreateInput) => Promise<void>;
  readonly onEditName: (accountId: string, displayName: string) => Promise<void>;
  readonly onCloseDialog: () => void;
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
}>) {
  return (
    <>
      <CreateAccountDialog
        open={dialogState.type === "create"}
        labels={labels}
        loading={creating}
        mutationError={mutationError}
        onClose={onCloseDialog}
        onSubmit={onCreate}
        validateDisplayName={validateDisplayName}
        validatePhoneNumberId={validatePhoneNumberId}
        validateWabaId={validateWabaId}
      />

      <EditNameDialog
        open={dialogState.type === "editName"}
        accountId={dialogState.accountId ?? null}
        initialDisplayName={dialogState.displayName ?? ""}
        labels={labels}
        loading={updatingId !== null}
        mutationError={mutationError}
        onClose={onCloseDialog}
        onSubmit={onEditName}
        validateDisplayName={validateDisplayName}
      />
    </>
  );
}
