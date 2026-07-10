"use client";

import { useQuery } from "@apollo/client/react";
import { FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { MeetingConfigSelect } from "@/frontend/components/ui/input/meetingConfigSelect/MeetingConfigSelect";
import { MeetingProviderSelect } from "@/frontend/components/ui/input/meetingProviderSelect/MeetingProviderSelect";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { userMeetingConfigsQueryDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import type { MeetingConfigSelectOption } from "@/frontend/graphql/types/meeting-class-config.operations";
import type { RecurringMeetingConfigFormState } from "@/frontend/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";

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

export function RecurringMeetingConfigSection({
  teacherId,
  value,
  onChangeAction,
  disabled,
}: RecurringMeetingConfigSectionProps) {
  const t = useTranslations("ui.meetingConfig.classScope");
  const tFields = useTranslations("ui.meetingConfig.fields");
  const tManager = useTranslations("ui.meetingConfig.manager");
  const { data, loading } = useQuery(userMeetingConfigsQueryDocument, {
    variables: { userId: teacherId },
    skip: !teacherId,
  });

  const configs = data?.userMeetingConfigs ?? [];
  const options = configs
    .filter((config): config is UserMeetingConfigFieldsFragment => Boolean(config.id))
    .map(toSelectOption);

  const mode = value.useTeacherDefault ? "default" : value.selectedConfig ? "existing" : "new";

  return (
    <Stack spacing={2}>
      <Typography sx={{ typography: "titleMd" }}>{t("recurringSectionTitle")}</Typography>
      <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{t("recurringSectionSubtitle")}</Typography>

      <RadioGroup
        value={mode}
        onChange={(_event, next) => {
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
        <FormControlLabel value="default" control={<Radio />} label={t("useTeacherDefault")} disabled={disabled} />
        <FormControlLabel
          value="existing"
          control={<Radio />}
          label={t("selectLabel")}
          disabled={disabled || options.length === 0}
        />
        <FormControlLabel value="new" control={<Radio />} label={t("createNewConfig")} disabled={disabled} />
      </RadioGroup>

      {mode === "existing" ? (
        <MeetingConfigSelect
          options={options}
          loading={loading}
          disabled={disabled}
          allowEmpty={false}
          value={value.selectedConfig ? toSelectOption(value.selectedConfig) : null}
          onChangeAction={option => {
            const match = configs.find(config => config.id === option?.id) as
              | UserMeetingConfigFieldsFragment
              | undefined;
            onChangeAction({ ...value, useTeacherDefault: false, selectedConfig: match ?? null });
          }}
        />
      ) : null}

      {mode === "new" ? (
        <Stack spacing={2}>
          <MeetingProviderSelect
            value={value.newProvider}
            onChangeAction={provider => onChangeAction({ ...value, newProvider: provider })}
            disabled={disabled}
            label={t("selectLabel")}
          />
          <TextField
            label={tManager("label")}
            value={value.newLabel}
            onChange={e => onChangeAction({ ...value, newLabel: e.target.value })}
            disabled={disabled}
            size="small"
            fullWidth
          />
          <TextField
            label={tFields("meetingUrl")}
            value={value.newMeetingUrl}
            onChange={e => onChangeAction({ ...value, newMeetingUrl: e.target.value })}
            disabled={disabled}
            size="small"
            fullWidth
            dir="ltr"
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
