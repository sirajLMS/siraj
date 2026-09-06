"use client";

import { useCallback } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { CreateAccountDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/createAccountDialog";
import { EditNameDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/editNameDialog";
import type {
  WhatsappCreateInput,
  WhatsappDialogState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * Create + edit dialog pair for the Numbers tab. The edit submit saves the
 * display name first, then re-assigns the routing purpose through its gated
 * mutation only when the selection changed.
 */
export function NumbersCreateEditDialogs({
  labels,
  dialogState,
  creating,
  updatingId,
  mutationError,
  onCreate,
  onEditName,
  onUpdatePurpose,
  onCloseDialog,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validatePurpose,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly dialogState: WhatsappDialogState;
  readonly creating: boolean;
  readonly updatingId: string | null;
  readonly mutationError: string | null;
  readonly onCreate: (input: WhatsappCreateInput) => Promise<void>;
  readonly onEditName: (accountId: string, displayName: string) => Promise<void>;
  readonly onUpdatePurpose: (accountId: string, purpose: WhatsappAccountPurpose) => Promise<void>;
  readonly onCloseDialog: () => void;
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
  readonly validatePurpose: (value: string) => string | null;
}>) {
  const handleEditSubmit = useCallback(
    async (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => {
      await onEditName(accountId, displayName);
      if (purpose !== dialogState.purpose) {
        await onUpdatePurpose(accountId, purpose);
      }
    },
    [onEditName, onUpdatePurpose, dialogState.purpose]
  );

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
        validatePurpose={validatePurpose}
      />

      <EditNameDialog
        open={dialogState.type === "editName"}
        accountId={dialogState.accountId ?? null}
        initialDisplayName={dialogState.displayName ?? ""}
        initialPurpose={dialogState.purpose ?? WhatsappAccountPurpose.General}
        labels={labels}
        loading={updatingId !== null}
        mutationError={mutationError}
        onClose={onCloseDialog}
        onSubmit={handleEditSubmit}
        validateDisplayName={validateDisplayName}
        validatePurpose={validatePurpose}
      />
    </>
  );
}
