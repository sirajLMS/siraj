"use client";

import { useMutation } from "@apollo/client/react";
import { Dialog } from "@mui/material";
import { useState } from "react";
import type { UserMeetingConfigUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  createUserMeetingConfigMutationDocument,
  generateMeetingUrlMutationDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { MeetingConfigFormDialogContent } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent";
import { useMeetingConfigFormState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

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
  readonly labels: MeetingConfigManagerLabels;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export function MeetingConfigFormDialog({
  open,
  userId,
  editConfig,
  existingCount,
  labels,
  onClose,
  onSaved,
}: MeetingConfigFormDialogProps) {
  const state = useMeetingConfigFormState({
    open,
    editConfig,
    existingCount,
    labels,
  });
  const { isEdit, label, isDefault, details, provider, providerChanged, validateUrl, setSaveError, t } = state;

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [updateConfig, { loading: updating }] = useMutation(updateUserMeetingConfigMutationDocument);
  const [generateUrl, { loading: generating }] = useMutation(generateMeetingUrlMutationDocument);
  const saving = creating || updating;

  const handleSave = async () => {
    const supportsAutoGeneration = provider?.fieldSchema?.supportsAutoGeneration === true;

    if (!isEdit && !provider?.id) return;

    // Block save when URL is blank and the provider does NOT support auto-generation.
    if (!details.meetingUrl.trim() && !supportsAutoGeneration) return;

    // validateUrl handles allowlist checks — skip when URL is blank (auto-gen path).
    if (details.meetingUrl.trim() && !validateUrl()) return;

    // When supportsAutoGeneration is true and URL is blank, send null so the
    // backend's maybeGenerateUrl generates one (REQ-6 AC1).
    const meetingUrl = details.meetingUrl.trim() || null;

    setSaveError(null);

    try {
      if (isEdit && editConfig?.id) {
        const updateInput: UserMeetingConfigUpdateInput = {
          label: label.trim() || null,
          isDefault,
          password: details.password.trim() || null,
          providerId: providerChanged && provider?.id ? provider.id : null,
          forceRegenerate: null,
          details: {
            meetingUrl,
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
                meetingUrl,
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
      setSaveError(t.saveError);
    }
  };

  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateUrl = async () => {
    if (!provider?.id) return;
    setGenerationError(null);
    try {
      const result = await generateUrl({
        variables: {
          input: {
            providerId: provider.id,
            topic: label.trim() || "Meeting",
            startDateTime: null,
            durationMinutes: null,
          },
        },
      });
      const joinUrl = result.data?.generateMeetingUrl?.joinUrl;
      if (joinUrl) {
        state.setDetails({ ...details, meetingUrl: joinUrl });
        state.setUrlError(null);
      } else {
        setGenerationError(t.saveError);
      }
    } catch {
      setGenerationError(t.saveError);
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
        onGenerateUrl={() => {
          void handleGenerateUrl();
        }}
        generating={generating}
        generationError={generationError}
      />
    </Dialog>
  );
}
