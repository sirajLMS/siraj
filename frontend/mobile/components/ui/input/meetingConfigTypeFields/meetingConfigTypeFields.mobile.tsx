"use client";

import TextField from "@mui/material/TextField";
import { getVisibleMeetingConfigFields } from "@/frontend/common/lib/meeting-config";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container";
import { useAppTranslation } from "@/shared/locale";

export type MeetingProviderFieldsFragment = {
  readonly id: string | null;
  readonly slug: string | null;
  readonly name: Partial<Record<"ar" | "en", string>> | null;
  readonly description: Partial<Record<"ar" | "en", string>> | null;
  readonly instructions: Partial<Record<"ar" | "en", string>> | null;
  readonly urlAllowlist: readonly string[] | null;
  readonly urlExample: string | null;
  readonly logoUrl: string | null;
  readonly isActive: boolean | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly fieldSchema: {
    readonly requiresMeetingUrl: boolean | null;
    readonly supportsUsername: boolean | null;
    readonly supportsPassword: boolean | null;
    readonly supportsTenantId: boolean | null;
  } | null;
};

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
