"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { MeetingConfigSelect } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelect";
import type { MeetingConfigSelectOption } from "@/frontend/common/components/ui/input/meetingConfigSelect/types";
import { MeetingConfigTypeFields } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelect } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { isUrlAllowedByProvider } from "@/shared/lib/meeting-config";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export type RecurringMeetingConfigSectionProps = {
  readonly teacherId: string;
  readonly value: RecurringMeetingConfigFormState;
  readonly onChangeAction: (next: RecurringMeetingConfigFormState) => void;
  readonly disabled?: boolean;
};

function toSelectOption(config: UserMeetingConfigFieldsFragment): MeetingConfigSelectOption {
  return {
    id: config.id ?? "",
    label: config.label,
    provider: config.provider ?? null,
    isDefault: config.isDefault ?? false,
  };
}

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

function RecurringMeetingConfigNewModeFields({
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
      <MeetingProviderSelect
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

function resolveMode(value: RecurringMeetingConfigFormState): "default" | "existing" | "new" {
  if (value.useTeacherDefault) {
    return "default";
  }
  if (value.selectedConfig) {
    return "existing";
  }
  return "new";
}

export function RecurringMeetingConfigSection({
  teacherId,
  value,
  onChangeAction,
  disabled,
}: RecurringMeetingConfigSectionProps) {
  const t = useAppTranslation(Translation.Ui.MeetingConfig).classScope;
  const tManager = useAppTranslation(Translation.Ui.MeetingConfig).manager;
  const locale = useAppLocale();
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const { data, loading } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: teacherId },
    skip: !teacherId,
  });

  const configs = data?.userMeetingConfigs ?? [];
  const options = configs
    .filter((config): config is UserMeetingConfigFieldsFragment => Boolean(config.id))
    .map(toSelectOption);

  const mode = resolveMode(value);

  const instructions = useMemo(() => {
    if (!value.newProvider?.instructions) return null;
    return resolveLocalizedString(value.newProvider.instructions, locale);
  }, [locale, value.newProvider?.instructions]);

  const validateNewModeFields = (): boolean => {
    const errorKey = getRecurringMeetingConfigErrorKey(value);
    const message = resolveRecurringMeetingConfigErrorMessage(errorKey, {
      recurringFieldsRequired: t.recurringFieldsRequired,
      urlNotAllowed: tManager.urlNotAllowed,
    });

    if (errorKey === "urlNotAllowed") {
      setUrlError(message);
      setFieldsError(null);
      return false;
    }

    if (errorKey === "incomplete") {
      setFieldsError(message);
      setUrlError(null);
      return false;
    }

    setUrlError(null);
    setFieldsError(null);
    return true;
  };

  const validateUrl = (): boolean => {
    if (!value.newProvider || !value.newMeetingUrl.trim()) {
      return validateNewModeFields();
    }

    const allowlist = value.newProvider.urlAllowlist ?? [];
    if (allowlist.length === 0) {
      setUrlError(null);
      return true;
    }

    if (isUrlAllowedByProvider(value.newMeetingUrl.trim(), allowlist)) {
      setUrlError(null);
      return true;
    }

    setUrlError(tManager.urlNotAllowed);
    return false;
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ typography: "titleLg" }}>{t.recurringSectionTitle}</Typography>
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {t.recurringSectionSubtitle}
      </Typography>

      <RadioGroup
        value={mode}
        onChange={(_event, next) => {
          setUrlError(null);
          setFieldsError(null);
          if (next === "default") {
            onChangeAction({ ...value, useTeacherDefault: true, selectedConfig: null });
            return;
          }
          if (next === "existing") {
            onChangeAction({ ...value, useTeacherDefault: false, newProvider: null, newMeetingUrl: "", newLabel: "" });
            return;
          }
          onChangeAction({ ...value, useTeacherDefault: false, selectedConfig: null });
        }}
      >
        <FormControlLabel value="default" control={<Radio />} label={t.useTeacherDefault} disabled={disabled} />
        <FormControlLabel
          value="existing"
          control={<Radio />}
          label={t.selectLabel}
          disabled={disabled ?? options.length === 0}
        />
        <FormControlLabel value="new" control={<Radio />} label={t.createNewConfig} disabled={disabled} />
      </RadioGroup>

      {mode === "existing" ? (
        <MeetingConfigSelect
          options={options}
          loading={loading}
          disabled={disabled}
          allowEmpty={false}
          value={value.selectedConfig ? toSelectOption(value.selectedConfig) : null}
          onChangeAction={option => {
            const selectedId = option?.id;
            const match = selectedId ? (configs.find(config => config.id === selectedId) ?? null) : null;
            onChangeAction({ ...value, useTeacherDefault: false, selectedConfig: match });
          }}
        />
      ) : null}

      {mode === "new" ? (
        <RecurringMeetingConfigNewModeFields
          value={value}
          onChangeAction={onChangeAction}
          disabled={disabled}
          urlError={urlError}
          fieldsError={fieldsError}
          onUrlErrorChange={setUrlError}
          onFieldsErrorChange={setFieldsError}
          onValidateUrl={validateUrl}
          instructions={instructions}
          selectLabel={t.selectLabel}
          recurringFieldsRequiredLabel={t.recurringFieldsRequired}
          labelFieldLabel={tManager.label}
        />
      ) : null}
    </Stack>
  );
}
