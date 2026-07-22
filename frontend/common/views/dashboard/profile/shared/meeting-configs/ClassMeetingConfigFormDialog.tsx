"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Dialog } from "@mui/material";
import type {
  ClassMeetingConfigFieldsFragment,
  CreateClassMeetingConfigMutation,
  CreateClassMeetingConfigMutationVariables,
  UpdateClassMeetingConfigMutation,
  UpdateClassMeetingConfigMutationVariables,
} from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { MeetingConfigFormDialogContent } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent";
import { useMeetingConfigFormState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";

export type ClassMeetingConfigFormDialogProps = {
  readonly open: boolean;
  readonly classInstanceId?: string;
  readonly recurringScheduleId?: string;
  readonly editConfig: ClassMeetingConfigFieldsFragment | null;
  readonly existingCount: number;
  readonly createMutation: TypedDocumentNode<
    CreateClassMeetingConfigMutation,
    CreateClassMeetingConfigMutationVariables
  >;
  readonly updateMutation: TypedDocumentNode<
    UpdateClassMeetingConfigMutation,
    UpdateClassMeetingConfigMutationVariables
  >;
  readonly onClose: () => void;
  readonly onSaved: () => void | Promise<void>;
};

export function ClassMeetingConfigFormDialog({
  open,
  classInstanceId,
  recurringScheduleId,
  editConfig,
  existingCount,
  createMutation,
  updateMutation,
  onClose,
  onSaved,
}: ClassMeetingConfigFormDialogProps) {
  const state = useMeetingConfigFormState({
    open,
    editConfig,
    existingCount,
  });
  const { isEdit, label, isDefault, details, provider, providerChanged, validateUrl, setSaveError, t } = state;

  const [createConfig, { loading: creating }] = useMutation(createMutation);
  const [updateConfig, { loading: updating }] = useMutation(updateMutation);
  const saving = creating || updating;

  const handleSave = async () => {
    if (!validateUrl()) return;
    if (!isEdit && !provider?.id) return;
    if (!details.meetingUrl.trim()) return;

    setSaveError(null);

    try {
      if (isEdit && editConfig?.id) {
        await updateConfig({
          variables: {
            id: editConfig.id,
            input: {
              label: label.trim() || null,
              isDefault,
              password: details.password.trim() || null,
              details: {
                meetingUrl: details.meetingUrl.trim(),
                username: details.username.trim() || null,
                tenantId: details.tenantId.trim() || null,
              },
              ...(providerChanged && provider?.id ? { providerId: provider.id } : {}),
            },
          },
        });
      } else if (provider?.id) {
        await createConfig({
          variables: {
            input: {
              classInstanceId: classInstanceId ?? null,
              recurringScheduleId: recurringScheduleId ?? null,
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

      await onSaved();
      onClose();
    } catch {
      setSaveError(t.saveError);
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
      />
    </Dialog>
  );
}
