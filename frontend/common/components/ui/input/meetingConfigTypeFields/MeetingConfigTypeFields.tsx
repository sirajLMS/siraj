"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { getVisibleMeetingConfigFields } from "@/frontend/common/lib/meeting-config";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  readonly onGenerateUrl?: () => void;
  readonly generating?: boolean;
  readonly generationError?: string | null;
};

export function MeetingConfigTypeFields({
  provider,
  value,
  onChangeAction,
  disabled,
  passwordHelperText,
  onMeetingUrlBlur,
  onGenerateUrl,
  generating,
  generationError,
}: MeetingConfigTypeFieldsProps) {
  const { fields: t } = useAppTranslation(Translation.Ui.MeetingConfig);

  if (!provider) {
    return null;
  }

  const fields = getVisibleMeetingConfigFields(provider);
  const supportsAuto = provider.fieldSchema?.supportsAutoGeneration === true;

  return (
    <Stack spacing={2}>
      <TextField
        label={t.meetingUrl}
        value={value.meetingUrl}
        disabled={disabled || (supportsAuto && Boolean(value.meetingUrl.trim()))}
        fullWidth
        placeholder={provider.urlExample ?? undefined}
        onChange={event => onChangeAction({ ...value, meetingUrl: event.target.value })}
        onBlur={onMeetingUrlBlur}
        slotProps={{ htmlInput: { dir: "ltr" } }}
      />
      {supportsAuto && onGenerateUrl ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button variant="outlined" size="small" disabled={disabled || generating} onClick={onGenerateUrl}>
            {generating ? t.generating : value.meetingUrl.trim() ? t.regenerate : t.generateAutomatically}
          </Button>
          {generationError ? (
            <Typography sx={{ typography: "bodySm", color: "error.main" }}>{generationError}</Typography>
          ) : null}
        </Stack>
      ) : null}
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
