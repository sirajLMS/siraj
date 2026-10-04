"use client";

import { useMutation } from "@apollo/client/react";
import { Dialog } from "@mui/material";
import { useId, useState } from "react";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { generateMeetingUrlMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  type MeetingConfigFormContentEnhancementLabels,
  MeetingConfigFormDialogContent,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent";
import { fetchGeneratedUrl } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigFormDialog.helpers";
import { useMeetingConfigFormState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import { useMeetingConfigFormDialogSave } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialogSave";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export type { MeetingConfigDetailsForm } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigFormDialog.helpers";

export type MeetingConfigFormDialogProps = {
  readonly open: boolean;
  readonly userId: string;
  readonly editConfig: UserMeetingConfigFieldsFragment | null;
  readonly existingCount: number;
  readonly labels: MeetingConfigManagerLabels;
  readonly enhancementLabels?: MeetingConfigFormContentEnhancementLabels;
  /** Full-screen dialog chrome; `true` from the mobile tier caller, `false` on desktop. */
  readonly fullScreen?: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export function MeetingConfigFormDialog({
  open,
  userId,
  editConfig,
  existingCount,
  labels,
  enhancementLabels,
  fullScreen = false,
  onClose,
  onSaved,
}: Readonly<MeetingConfigFormDialogProps>) {
  const state = useMeetingConfigFormState({
    open,
    editConfig,
    existingCount,
    labels,
  });
  const { isEdit } = state;
  const formId = useId();

  const { saving, handleSave } = useMeetingConfigFormDialogSave({
    userId,
    editConfig,
    state,
    onSaved,
    onClose,
  });

  const [generateUrl, { loading: generating }] = useMutation(generateMeetingUrlMutationDocument);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateUrl = async () => {
    setGenerationError(null);
    const joinUrl = await fetchGeneratedUrl(generateUrl, state.provider, state.label);
    if (joinUrl) {
      state.setDetails({ ...state.details, meetingUrl: joinUrl });
      state.setUrlError(null);
    } else {
      setGenerationError(state.t.saveError);
    }
  };

  const handleTestConfig = async () => {
    if (!state.provider?.id) return;
    setTestError(null);
    setPreviewUrl(null);
    const joinUrl = await fetchGeneratedUrl(generateUrl, state.provider, state.label);
    if (joinUrl) {
      setPreviewUrl(joinUrl);
    } else {
      setTestError(state.t.saveError);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <MeetingConfigFormDialogContent
        formId={formId}
        state={state}
        saving={saving}
        hasSecretOnEdit={!!(isEdit && editConfig?.hasSecret)}
        onClose={onClose}
        onSave={() => {
          void handleSave();
        }}
        providerSelectDisabled={false}
        cancelLabel={state.t.cancel}
        saveLabel={state.t.save}
        enhancementLabels={enhancementLabels}
        onTestConfig={
          enhancementLabels
            ? () => {
                void handleTestConfig();
              }
            : undefined
        }
        testing={generating}
        previewUrl={previewUrl}
        testError={testError}
        onGenerateUrl={() => {
          void handleGenerateUrl();
        }}
        generating={generating}
        generationError={generationError}
      />
    </Dialog>
  );
}
