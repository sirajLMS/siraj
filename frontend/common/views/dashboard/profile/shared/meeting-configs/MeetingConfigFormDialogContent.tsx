"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig";
import { MeetingConfigTypeFields } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelect } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { UseMeetingConfigFormStateReturn } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

/** Enhancement label keys consumed by the form content (Test Config + copy URL). */
export type MeetingConfigFormContentEnhancementLabels = Pick<
  MeetingConfigEnhancementLabels,
  "testConfig" | "previewUrlGenerated" | "copyMeetingUrl"
>;

function TestConfigPreviewUrl({ previewUrl, copyLabel }: { readonly previewUrl: string; readonly copyLabel: string }) {
  return (
    <Stack spacing={0.5}>
      <TextField
        value={previewUrl}
        fullWidth
        size="small"
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <CopyMeetingUrlButton meetingUrl={previewUrl} ariaLabel={copyLabel} tooltipLabel={copyLabel} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  );
}

function TestConfigSection({
  enhancementLabels,
  onTestConfig,
  testing,
  saving,
  providerId,
  previewUrl,
  testError,
}: {
  readonly enhancementLabels: MeetingConfigFormContentEnhancementLabels;
  readonly onTestConfig: () => void;
  readonly testing: boolean;
  readonly saving: boolean;
  readonly providerId: string | null | undefined;
  readonly previewUrl: string | null;
  readonly testError: string | null;
}) {
  return (
    <Stack spacing={1}>
      <Button
        variant="outlined"
        onClick={onTestConfig}
        disabled={!providerId || saving || testing}
        startIcon={testing ? <CircularProgress size={16} /> : undefined}
        sx={theme => ({ borderRadius: 1.5, fontWeight: 700, color: theme.palette.primary.main, minHeight: 48 })}
      >
        {enhancementLabels.testConfig}
      </Button>
      {testError ? <Alert severity="error">{testError}</Alert> : null}
      {previewUrl ? (
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>
            {enhancementLabels.previewUrlGenerated}
          </Typography>
          <TestConfigPreviewUrl previewUrl={previewUrl} copyLabel={enhancementLabels.copyMeetingUrl} />
        </Stack>
      ) : null}
    </Stack>
  );
}

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
  const {
    t,
    isEdit,
    label,
    setLabel,
    provider,
    setProvider,
    details,
    setDetails,
    isDefault,
    setIsDefault,
    urlError,
    setUrlError,
    saveError,
    providerChanged,
    instructions,
  } = state;

  const showTestButton = onTestConfig != null && enhancementLabels != null;

  return (
    <>
      <DialogTitle>{isEdit ? t.editTitle : t.addTitle}</DialogTitle>
      <DialogContent>
        <Box
          id={formId}
          component="form"
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
        >
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label={t.label} value={label} onChange={e => setLabel(e.target.value)} fullWidth size="small" />
            <MeetingProviderSelect
              value={provider}
              onChangeAction={setProvider}
              label={t.provider}
              disabled={providerSelectDisabled}
            />
            {providerChanged ? <Alert severity="warning">{t.providerChangeWarning}</Alert> : null}
            {instructions ? (
              <Alert severity="info">
                {provider?.name ? (
                  <LocalizedStringDisplay value={provider.name} typographyVariant="labelMd" sx={{ fontWeight: 700 }} />
                ) : null}
                <Typography sx={{ typography: "bodyMd", mt: provider?.name ? 0.5 : 0 }}>{instructions}</Typography>
              </Alert>
            ) : null}
            <MeetingConfigTypeFields
              provider={provider}
              value={details}
              onChangeAction={value => {
                setDetails({
                  meetingUrl: value.meetingUrl,
                  username: value.username ?? "",
                  password: value.password ?? "",
                  tenantId: value.tenantId ?? "",
                });
                setUrlError(null);
              }}
              passwordHelperText={hasSecretOnEdit ? t.passwordLeaveBlank : undefined}
              onGenerateUrl={onGenerateUrl}
              generating={generating}
              generationError={generationError}
            />
            {urlError ? (
              <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>
                {urlError}
              </Typography>
            ) : null}
            {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            <FormControlLabel
              control={<Checkbox checked={isDefault} onChange={event => setIsDefault(event.target.checked)} />}
              label={t.setAsDefault}
            />
            {showTestButton && enhancementLabels && onTestConfig ? (
              <TestConfigSection
                enhancementLabels={enhancementLabels}
                onTestConfig={onTestConfig}
                testing={testing ?? false}
                saving={saving}
                providerId={provider?.id}
                previewUrl={previewUrl ?? null}
                testError={testError ?? null}
              />
            ) : null}
          </Stack>
        </Box>
      </DialogContent>
      <EntityFormDialogActions
        formId={formId}
        cancelLabel={cancelLabel}
        saveLabel={saveLabel}
        onClose={onClose}
        isLoading={saving}
      />
    </>
  );
}
