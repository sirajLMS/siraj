"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { getVisibleMeetingConfigFields } from "@/frontend/common/lib/meeting-config";
import { useAppTranslation } from "@/shared/locale/client";

export type MeetingConfigDetailsFormValue = {
  meetingUrl: string;
  username?: string;
  password?: string;
  tenantId?: string;
};

export type MeetingConfigTypeFieldsProps = {
  readonly provider: MeetingProviderFieldsFragment | null;
  readonly value: MeetingConfigDetailsFormValue;
  readonly onChangeAction: (value: MeetingConfigDetailsFormValue) => void;
  readonly disabled?: boolean;
  readonly passwordHelperText?: string;
  readonly onMeetingUrlBlur?: () => void;
};

export function MeetingConfigTypeFields({
  provider,
  value,
  onChangeAction,
  disabled,
  passwordHelperText,
  onMeetingUrlBlur,
}: MeetingConfigTypeFieldsProps) {
  const { fields: t } = useAppTranslation().uiTranslations.meetingConfig;

  if (!provider) {
    return null;
  }

  const fields = getVisibleMeetingConfigFields(provider);

  return (
    <Stack spacing={2}>
      <TextField
        label={t.meetingUrl}
        value={value.meetingUrl}
        disabled={disabled}
        fullWidth
        placeholder={provider.urlExample ?? undefined}
        onChange={event => onChangeAction({ ...value, meetingUrl: event.target.value })}
        onBlur={onMeetingUrlBlur}
        slotProps={{ htmlInput: { dir: "ltr" } }}
      />
      {fields.showUsername ? (
        <TextField
          label={t.username}
          value={value.username ?? ""}
          disabled={disabled}
          fullWidth
          onChange={event => onChangeAction({ ...value, username: event.target.value })}
        />
      ) : null}
      {fields.showPassword ? (
        <TextField
          label={t.password}
          type="password"
          value={value.password ?? ""}
          disabled={disabled}
          fullWidth
          helperText={passwordHelperText}
          onChange={event => onChangeAction({ ...value, password: event.target.value })}
        />
      ) : null}
      {fields.showTenantId ? (
        <TextField
          label={t.tenantId}
          value={value.tenantId ?? ""}
          disabled={disabled}
          fullWidth
          onChange={event => onChangeAction({ ...value, tenantId: event.target.value })}
        />
      ) : null}
    </Stack>
  );
}
