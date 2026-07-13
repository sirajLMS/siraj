"use client";

import { useMutation } from "@apollo/client/react";
import { Dialog } from "@mui/material";
import type { UserMeetingConfigUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  createUserMeetingConfigMutationDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { MeetingConfigFormDialogContent } from "@/frontend/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent";
import {
  type MeetingConfigFormEditInfo,
  useMeetingConfigFormState,
} from "@/frontend/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";

export type MeetingConfigDetailsForm = {
  meetingUrl: string;
  username: string;
  password: string;
  tenantId: string;
};

export type MeetingConfigFormDialogProps = {
  readonly open: boolean;
  readonly userId: string;
  readonly editConfig: UserMeetingConfigFieldsFragment | null;
  readonly existingCount: number;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export function MeetingConfigFormDialog({
  open,
  userId,
  editConfig,
  existingCount,
  onClose,
  onSaved,
}: MeetingConfigFormDialogProps) {
  const state = useMeetingConfigFormState({
    open,
    editConfig: editConfig as MeetingConfigFormEditInfo | null,
    existingCount,
  });
  const { isEdit, label, isDefault, details, provider, providerChanged, validateUrl, setSaveError, t } = state;

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [updateConfig, { loading: updating }] = useMutation(updateUserMeetingConfigMutationDocument);
  const saving = creating || updating;

  const handleSave = async () => {
    if (!validateUrl()) return;
    if (!isEdit && !provider?.id) return;
    if (!details.meetingUrl.trim()) return;

    setSaveError(null);

    try {
      if (isEdit && editConfig?.id) {
        const updateInput: UserMeetingConfigUpdateInput = {
          label: label.trim() || null,
          isDefault,
          password: details.password.trim() || null,
          providerId: providerChanged && provider?.id ? provider.id : null,
          details: {
            meetingUrl: details.meetingUrl.trim(),
            username: details.username.trim() || null,
            tenantId: details.tenantId.trim() || null,
          },
        };
        await updateConfig({
          variables: {
            id: editConfig.id,
            input: updateInput,
          },
        });
      } else if (provider?.id) {
        await createConfig({
          variables: {
            input: {
              userId,
              providerId: provider.id,
              label: label.trim() || null,
              isDefault,
              password: details.password.trim() || null,
              details: {
                meetingUrl: details.meetingUrl.trim(),
                username: details.username.trim() || null,
                tenantId: details.tenantId.trim() || null,
              },
            },
          },
        });
      }

      onSaved();
      onClose();
    } catch {
      setSaveError(t("saveError"));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <MeetingConfigFormDialogContent
        state={state}
        saving={saving}
        hasSecretOnEdit={!!(isEdit && editConfig?.hasSecret)}
        onClose={onClose}
        onSave={() => {
          void handleSave();
        }}
        providerSelectDisabled={false}
      />
    </Dialog>
  );
}
