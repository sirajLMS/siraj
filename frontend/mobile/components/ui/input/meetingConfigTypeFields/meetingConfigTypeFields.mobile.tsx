"use client";

import TextField from "@mui/material/TextField";
import type { MeetingConfigTypeFieldsProps } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { getVisibleMeetingConfigFields } from "@/frontend/common/lib/meeting-config";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container";
import { useAppTranslation } from "@/shared/locale";

export function MeetingConfigTypeFieldsMobile({
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
    <MobileContentStack gap={1.5}>
      <TextField
        label={t.meetingUrl}
        value={value.meetingUrl}
        disabled={disabled}
        fullWidth
        size="small"
        inputMode="url"
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
          size="small"
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
          size="small"
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
          size="small"
          onChange={event => onChangeAction({ ...value, tenantId: event.target.value })}
        />
      ) : null}
    </MobileContentStack>
  );
}
