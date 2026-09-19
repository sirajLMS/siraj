"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { MeetingConfigSelect } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelect";
import type { MeetingConfigSelectOption } from "@/frontend/common/components/ui/input/meetingConfigSelect/types";
import { MeetingConfigTypeFields } from "@/frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields";
import { MeetingProviderSelectContainer } from "@/frontend/common/components/ui/input/meetingProviderSelect/MeetingProviderSelectContainer";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import type { RecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export type RecurringMeetingConfigSectionProps = {
  readonly teacherId: string;
  readonly value: RecurringMeetingConfigFormState;
  readonly onChangeAction: (next: RecurringMeetingConfigFormState) => void;
  readonly validation: RecurringMeetingConfigValidation;
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
  validation,
  disabled,
}: RecurringMeetingConfigSectionProps) {
  const t = useAppTranslation(Translation.Ui.MeetingConfig).classScope;
  const tManager = useAppTranslation(Translation.Ui.MeetingConfig).manager;
  const locale = useAppLocale();
  const { data, loading } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: teacherId },
    skip: !teacherId,
  });

  const configs = data?.userMeetingConfigs ?? [];
  const options = configs
    .filter((config): config is UserMeetingConfigFieldsFragment => Boolean(config.id))
    .map(toSelectOption);

  const mode = resolveMode(value);

  const providerInstructions = value.newProvider?.instructions ?? null;
  const instructions = useMemo(() => {
    if (!providerInstructions) return null;
    return resolveLocalizedString(providerInstructions, locale);
  }, [locale, providerInstructions]);

  return (
    <Stack spacing={2}>
      <Typography sx={{ typography: "titleLg" }}>{t.recurringSectionTitle}</Typography>
      <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
        {t.recurringSectionSubtitle}
      </Typography>

      <RadioGroup
        value={mode}
        onChange={(_event, next) => {
          validation.resetErrors();
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
          urlError={validation.urlError}
          fieldsError={validation.fieldsError}
          onUrlErrorChange={validation.onUrlErrorChange}
          onFieldsErrorChange={validation.onFieldsErrorChange}
          onValidateUrl={validation.onValidateUrl}
          instructions={instructions}
          selectLabel={t.selectLabel}
          recurringFieldsRequiredLabel={t.recurringFieldsRequired}
          labelFieldLabel={tManager.label}
        />
      ) : null}
    </Stack>
  );
}
