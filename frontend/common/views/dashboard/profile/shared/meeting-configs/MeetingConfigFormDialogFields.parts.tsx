"use client";

import { Alert, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { MeetingConfigTypeFields } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelectContainer } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelectContainer";
import { ProviderInstructionsAlert } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent.parts";
import type { UseMeetingConfigFormStateReturn } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";

export function MeetingConfigFormDialogFields({
  state,
  hasSecretOnEdit,
  providerSelectDisabled,
  onGenerateUrl,
  generating,
  generationError,
}: {
  readonly state: UseMeetingConfigFormStateReturn;
  readonly hasSecretOnEdit: boolean;
  readonly providerSelectDisabled: boolean | undefined;
  readonly onGenerateUrl: (() => void) | undefined;
  readonly generating: boolean | undefined;
  readonly generationError: string | null | undefined;
}) {
  const {
    t,
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

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <TextField label={t.label} value={label} onChange={e => setLabel(e.target.value)} fullWidth size="small" />
      <MeetingProviderSelectContainer
        value={provider}
        onChangeAction={setProvider}
        label={t.provider}
        disabled={providerSelectDisabled}
      />
      {providerChanged ? <Alert severity="warning">{t.providerChangeWarning}</Alert> : null}
      {instructions ? <ProviderInstructionsAlert provider={provider} instructions={instructions} /> : null}
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
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>{urlError}</Typography>
      ) : null}
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <FormControlLabel
        control={<Checkbox checked={isDefault} onChange={event => setIsDefault(event.target.checked)} />}
        label={t.setAsDefault}
      />
    </Stack>
  );
}
