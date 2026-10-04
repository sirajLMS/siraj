"use client";

import { Alert, Stack, TextField, Typography } from "@mui/material";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { MeetingConfigTypeFields } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelectContainer } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelectContainer";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";

type RecurringMeetingConfigNewModeFieldsProps = {
  readonly value: RecurringMeetingConfigFormState;
  readonly onChangeAction: (next: RecurringMeetingConfigFormState) => void;
  readonly disabled?: boolean;
  readonly urlError: string | null;
  readonly fieldsError: string | null;
  readonly onUrlErrorChange: (error: string | null) => void;
  readonly onFieldsErrorChange: (error: string | null) => void;
  readonly onValidateUrl: () => boolean;
  readonly instructions: string | null;
  readonly selectLabel: string;
  readonly recurringFieldsRequiredLabel: string;
  readonly labelFieldLabel: string;
};

export function RecurringMeetingConfigNewModeFields({
  value,
  onChangeAction,
  disabled,
  urlError,
  fieldsError,
  onUrlErrorChange,
  onFieldsErrorChange,
  onValidateUrl,
  instructions,
  selectLabel,
  recurringFieldsRequiredLabel,
  labelFieldLabel,
}: RecurringMeetingConfigNewModeFieldsProps) {
  return (
    <Stack spacing={2}>
      <MeetingProviderSelectContainer
        value={value.newProvider}
        onChangeAction={provider => {
          onChangeAction({ ...value, newProvider: provider });
          onUrlErrorChange(null);
          onFieldsErrorChange(null);
        }}
        disabled={disabled}
        label={selectLabel}
      />
      {!value.newProvider && (value.newMeetingUrl.trim() || value.newLabel.trim()) ? (
        <Alert severity="warning">{recurringFieldsRequiredLabel}</Alert>
      ) : null}
      {instructions ? (
        <Alert severity="info">
          {value.newProvider?.name ? (
            <LocalizedStringDisplay
              value={value.newProvider.name}
              typographyVariant="labelMd"
              sx={{ fontWeight: 700 }}
            />
          ) : null}
          <Typography sx={{ typography: "bodyMd", mt: value.newProvider?.name ? 0.5 : 0 }}>{instructions}</Typography>
        </Alert>
      ) : null}
      <TextField
        label={labelFieldLabel}
        value={value.newLabel}
        onChange={e => onChangeAction({ ...value, newLabel: e.target.value })}
        disabled={disabled}
        size="small"
        fullWidth
      />
      <MeetingConfigTypeFields
        provider={value.newProvider}
        value={{
          meetingUrl: value.newMeetingUrl,
          username: "",
          password: "",
          tenantId: "",
        }}
        onChangeAction={next => {
          onChangeAction({ ...value, newMeetingUrl: next.meetingUrl });
          onUrlErrorChange(null);
          onFieldsErrorChange(null);
        }}
        onMeetingUrlBlur={onValidateUrl}
        disabled={disabled}
      />
      {urlError ? (
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>{urlError}</Typography>
      ) : null}
      {fieldsError ? (
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>{fieldsError}</Typography>
      ) : null}
    </Stack>
  );
}
