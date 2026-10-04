"use client";

import { useQuery } from "@apollo/client/react";
import { FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { MeetingConfigSelect } from "@/frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelect";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { userMeetingConfigsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  resolveMode,
  toSelectOption,
} from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.helpers";
import { RecurringMeetingConfigNewModeFields } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.parts";
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
