"use client";

import { useMutation } from "@apollo/client/react";
import { Dialog, type Theme, useMediaQuery } from "@mui/material";
import { useId, useState } from "react";
import type { UserMeetingConfigUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  createUserMeetingConfigMutationDocument,
  generateMeetingUrlMutationDocument,
  updateUserMeetingConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  type MeetingConfigFormContentEnhancementLabels,
  MeetingConfigFormDialogContent,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent";
import { useMeetingConfigFormState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import { createMeetingConfigFormSchema } from "@/frontend/common/views/dashboard/settings/schemas/meetingConfigForm.schema";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export type MeetingConfigDetailsForm = {
  meetingUrl: string;
  username: string;
  password: string;
  tenantId: string;
};

/** Extract a user-friendly save error from a failed zod safeParse. */
function resolveZodErrorMessage(
  result: ReturnType<ReturnType<typeof createMeetingConfigFormSchema>["safeParse"]>,
  labels: MeetingConfigManagerLabels,
  fallback: string
): string {
  if (!result.success) {
    const firstError = result.error.issues[0];
    if (firstError?.path[0] === "name") return labels.nameRequired;
    if (firstError?.path[0] === "providerSlug") return labels.providerRequired;
    return firstError?.message ?? fallback;
  }
  return fallback;
}

/** Build the update mutation input from form state. */
function buildUpdateInput(args: {
  readonly label: string;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetailsForm;
  readonly provider: { readonly id: string | null } | null;
  readonly providerChanged: boolean;
}): UserMeetingConfigUpdateInput {
  const meetingUrl = args.details.meetingUrl.trim() || null;
  return {
    label: args.label.trim() || null,
    isDefault: args.isDefault,
    password: args.details.password.trim() || null,
    providerId: args.providerChanged && args.provider?.id ? args.provider.id : null,
    forceRegenerate: null,
    details: {
      meetingUrl,
      username: args.details.username.trim() || null,
      tenantId: args.details.tenantId.trim() || null,
    },
  };
}

/** Build the create mutation input's details payload. */
function buildDetailsPayload(details: MeetingConfigDetailsForm, meetingUrl: string | null) {
  return {
    meetingUrl,
    username: details.username.trim() || null,
    tenantId: details.tenantId.trim() || null,
  };
}

/** Call generateMeetingUrl mutation and return the joinUrl or null on failure. */
async function fetchGeneratedUrl(
  mutate: (options: {
    readonly variables: {
      readonly input: {
        readonly providerId: string;
        readonly topic: string;
        readonly startDateTime: string | null;
        readonly durationMinutes: number | null;
      };
    };
  }) => Promise<{
    readonly data?: { readonly generateMeetingUrl?: { readonly joinUrl?: string | null } | null } | null;
  }>,
  provider: { readonly id: string | null } | null,
  label: string
): Promise<string | null> {
  if (!provider?.id) return null;
  try {
    const result = await mutate({
      variables: {
        input: {
          providerId: provider.id,
          topic: label.trim() || "Meeting",
          startDateTime: null,
          durationMinutes: null,
        },
      },
    });
    return result.data?.generateMeetingUrl?.joinUrl ?? null;
  } catch {
    return null;
  }
}

export type MeetingConfigFormDialogProps = {
  readonly open: boolean;
  readonly userId: string;
  readonly editConfig: UserMeetingConfigFieldsFragment | null;
  readonly existingCount: number;
  readonly labels: MeetingConfigManagerLabels;
  readonly enhancementLabels?: MeetingConfigFormContentEnhancementLabels;
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
  onClose,
  onSaved,
}: Readonly<MeetingConfigFormDialogProps>) {
  const state = useMeetingConfigFormState({
    open,
    editConfig,
    existingCount,
    labels,
  });
  const { isEdit, label, isDefault, details, provider, providerChanged, validateUrl, setSaveError, t } = state;
  const formId = useId();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"), { noSsr: true });

  const schema = createMeetingConfigFormSchema(labels);

  const [createConfig, { loading: creating }] = useMutation(createUserMeetingConfigMutationDocument);
  const [updateConfig, { loading: updating }] = useMutation(updateUserMeetingConfigMutationDocument);
  const [generateUrl, { loading: generating }] = useMutation(generateMeetingUrlMutationDocument);
  const saving = creating || updating;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleSave = async () => {
    const supportsAutoGeneration = provider?.fieldSchema?.supportsAutoGeneration === true;

    if (!isEdit && !provider?.id) return;

    // Zod schema validation: name + providerSlug required.
    const zodResult = schema.safeParse({
      name: label,
      providerSlug: provider?.slug ?? "",
      isDefault,
      autoGenerate: supportsAutoGeneration && !details.meetingUrl.trim(),
      settings: { ...details },
    });
    if (!zodResult.success) {
      setSaveError(resolveZodErrorMessage(zodResult, labels, t.saveError));
      return;
    }

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

  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateUrl = async () => {
    setGenerationError(null);
    const joinUrl = await fetchGeneratedUrl(generateUrl, provider, label);
    if (joinUrl) {
      state.setDetails({ ...details, meetingUrl: joinUrl });
      state.setUrlError(null);
    } else {
      setGenerationError(t.saveError);
    }
  };

  const handleTestConfig = async () => {
    if (!provider?.id) return;
    setTestError(null);
    setPreviewUrl(null);
    const joinUrl = await fetchGeneratedUrl(generateUrl, provider, label);
    if (joinUrl) {
      setPreviewUrl(joinUrl);
    } else {
      setTestError(t.saveError);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
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
        cancelLabel={t.cancel}
        saveLabel={t.save}
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
