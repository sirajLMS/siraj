"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
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

export type MeetingConfigTypeFieldsSharedOptions = {
  readonly textFieldSize?: "small" | "medium";
  readonly urlInputMode?: "url";
};

const DEFAULT_OPTIONS: MeetingConfigTypeFieldsSharedOptions = {};

type ContainerSlot = React.ComponentType<{
  readonly children?: React.ReactNode;
  readonly spacing?: number;
  readonly gap?: number;
}>;

export function MeetingConfigTypeFieldsShared({
  provider,
  value,
  onChangeAction,
  disabled,
  passwordHelperText,
  onMeetingUrlBlur,
  onGenerateUrl,
  generating,
  generationError,
  options = DEFAULT_OPTIONS,
  Container,
}: Readonly<MeetingConfigTypeFieldsProps> & {
  readonly options?: MeetingConfigTypeFieldsSharedOptions;
  readonly Container: ContainerSlot;
}): React.ReactNode {
  const { fields: t } = useAppTranslation(Translation.Ui.MeetingConfig);

  if (!provider) {
    return null;
  }

  const fields = getVisibleMeetingConfigFields(provider);
  const supportsAuto = provider.fieldSchema?.supportsAutoGeneration === true;

  let generateButtonText = t.generateAutomatically;
  if (generating) {
    generateButtonText = t.generating;
  } else if (value.meetingUrl.trim()) {
    generateButtonText = t.regenerate;
  }

  const sizeProp = options.textFieldSize ? { size: options.textFieldSize } : {};
  const urlInputModeProp = options.urlInputMode ? { inputMode: options.urlInputMode } : {};

  return (
    <Container spacing={2}>
      <TextField
        label={t.meetingUrl}
        value={value.meetingUrl}
        disabled={disabled ?? (supportsAuto && Boolean(value.meetingUrl.trim()))}
        fullWidth
        placeholder={provider.urlExample ?? undefined}
        {...sizeProp}
        {...urlInputModeProp}
        onChange={event => onChangeAction({ ...value, meetingUrl: event.target.value })}
        onBlur={onMeetingUrlBlur}
        slotProps={{ htmlInput: { dir: "ltr" } }}
      />
      {supportsAuto && onGenerateUrl ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button variant="outlined" size="small" disabled={disabled ?? generating} onClick={onGenerateUrl}>
            {generateButtonText}
          </Button>
          {generationError ? (
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>
              {generationError}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
      {fields.showUsername ? (
        <TextField
          label={t.username}
          value={value.username ?? ""}
          disabled={disabled}
          fullWidth
          {...sizeProp}
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
          {...sizeProp}
          onChange={event => onChangeAction({ ...value, password: event.target.value })}
        />
      ) : null}
      {fields.showTenantId ? (
        <TextField
          label={t.tenantId}
          value={value.tenantId ?? ""}
          disabled={disabled}
          fullWidth
          {...sizeProp}
          onChange={event => onChangeAction({ ...value, tenantId: event.target.value })}
        />
      ) : null}
    </Container>
  );
}
