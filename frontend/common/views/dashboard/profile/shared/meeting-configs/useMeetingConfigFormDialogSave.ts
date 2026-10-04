"use client";

import { useMutation } from "@apollo/client/react";
import {
  createUserMeetingConfigMutationDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  buildDetailsPayload,
  buildUpdateInput,
  resolveSaveRejection,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigFormDialog.helpers";
import type {
  MeetingConfigFormEditInfo,
  UseMeetingConfigFormStateReturn,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import { createMeetingConfigFormSchema } from "@/frontend/common/views/dashboard/settings/schemas/meetingConfigForm.schema";

export type UseMeetingConfigFormDialogSaveArgs = {
  readonly userId: string;
  readonly editConfig: MeetingConfigFormEditInfo | null;
  readonly state: UseMeetingConfigFormStateReturn;
  readonly onSaved: () => void;
  readonly onClose: () => void;
};

export function useMeetingConfigFormDialogSave({
  userId,
  editConfig,
  state,
  onSaved,
  onClose,
}: UseMeetingConfigFormDialogSaveArgs) {
  const { isEdit, label, isDefault, details, provider, providerChanged, setSaveError, t } = state;
  const schema = createMeetingConfigFormSchema(t);

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [updateConfig, { loading: updating }] = useMutation(updateUserMeetingConfigMutationDocument);
  const saving = creating || updating;

  const handleSave = async () => {
    const rejection = resolveSaveRejection({ isEdit, state, schema });
    if (rejection) {
      if (rejection.type === "error") setSaveError(rejection.message);
      return;
    }

    // When supportsAutoGeneration is true and URL is blank, send null so the
    // backend generates a meeting URL on save.
    const meetingUrl = details.meetingUrl.trim() || null;

    setSaveError(null);

    try {
      if (isEdit && editConfig?.id) {
        await updateConfig({
          variables: {
            id: editConfig.id,
            input: buildUpdateInput({ label, isDefault, details, provider, providerChanged }),
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
              details: buildDetailsPayload(details, meetingUrl),
            },
          },
        });
      }

      onSaved();
      onClose();
    } catch {
      setSaveError(t.saveError);
    }
  };

  return { saving, handleSave };
}
