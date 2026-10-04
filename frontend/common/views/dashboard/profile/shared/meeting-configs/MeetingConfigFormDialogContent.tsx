"use client";

import { Stack } from "@mui/material";
import { BaseFormDialogSection } from "@/frontend/common/components/ui/dialog";
import { TestConfigSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent.parts";
import { MeetingConfigFormDialogFields } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogFields.parts";
import type { MeetingConfigFormContentEnhancementLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigFormDialogContent.types";
import type { UseMeetingConfigFormStateReturn } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";

export type { MeetingConfigFormContentEnhancementLabels } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigFormDialogContent.types";

export type MeetingConfigFormDialogContentProps = {
  readonly formId: string;
  readonly state: UseMeetingConfigFormStateReturn;
  readonly saving: boolean;
  readonly hasSecretOnEdit: boolean;
  readonly onClose: () => void;
  readonly onSave: () => void;
  readonly providerSelectDisabled?: boolean;
  readonly cancelLabel: string;
  readonly saveLabel: string;
  /** Enhancement labels for Test Config + preview section. When omitted, Test Config button is hidden. */
  readonly enhancementLabels?: MeetingConfigFormContentEnhancementLabels;
  /** Fired when user clicks "Test Config" (generates a preview URL). */
  readonly onTestConfig?: () => void;
  readonly testing?: boolean;
  /** Generated preview URL to display in the dialog. */
  readonly previewUrl?: string | null;
  /** Error message for the test-config action. */
  readonly testError?: string | null;
  /** Legacy generate-url callback (passed through to MeetingConfigTypeFields). */
  readonly onGenerateUrl?: () => void;
  readonly generating?: boolean;
  readonly generationError?: string | null;
};

export function MeetingConfigFormDialogContent({
  formId,
  state,
  saving,
  hasSecretOnEdit,
  onClose,
  onSave,
  providerSelectDisabled,
  cancelLabel,
  saveLabel,
  enhancementLabels,
  onTestConfig,
  testing,
  previewUrl,
  testError,
  onGenerateUrl,
  generating,
  generationError,
}: Readonly<MeetingConfigFormDialogContentProps>) {
  const { t, isEdit, provider } = state;

  const showTestButton = onTestConfig != null && enhancementLabels != null;

  return (
    <BaseFormDialogSection
      title={isEdit ? t.editTitle : t.addTitle}
      cancelLabel={cancelLabel}
      confirmLabel={saveLabel}
      onClose={onClose}
      isLoading={saving}
      formId={formId}
    >
      <form
        id={formId}
        onSubmit={e => {
          e.preventDefault();
          onSave();
        }}
      >
        <MeetingConfigFormDialogFields
          state={state}
          hasSecretOnEdit={hasSecretOnEdit}
          providerSelectDisabled={providerSelectDisabled}
          onGenerateUrl={onGenerateUrl}
          generating={generating}
          generationError={generationError}
        />
        {showTestButton && enhancementLabels && onTestConfig ? (
          <Stack sx={{ pt: 2.5 }}>
            <TestConfigSection
              enhancementLabels={enhancementLabels}
              onTestConfig={onTestConfig}
              testing={testing ?? false}
              saving={saving}
              providerId={provider?.id}
              previewUrl={previewUrl ?? null}
              testError={testError ?? null}
            />
          </Stack>
        ) : null}
      </form>
    </BaseFormDialogSection>
  );
}
