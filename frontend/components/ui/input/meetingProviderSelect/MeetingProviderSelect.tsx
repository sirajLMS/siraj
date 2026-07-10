"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useQuery } from "@apollo/client/react";
import { useLocale } from "next-intl";
import type { MeetingProviderFieldsFragment, UserMeetingConfigFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { meetingProvidersQueryDocument } from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";

export type MeetingProviderSelectProps = {
  readonly value: MeetingProviderFieldsFragment | null;
  readonly onChangeAction: (provider: MeetingProviderFieldsFragment | null) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
};

export function MeetingProviderSelect({
  value,
  onChangeAction,
  disabled,
  label,
  error,
  helperText,
}: MeetingProviderSelectProps) {
  const locale = useLocale();
  const { data, loading } = useQuery(meetingProvidersQueryDocument, {
    variables: { activeOnly: true },
  });

  const options = data?.meetingProviders ?? [];

  return (
    <Autocomplete
      options={options}
      loading={loading}
      disabled={disabled}
      value={value}
      onChange={(_event, next) => onChangeAction(next)}
      getOptionLabel={option => resolveLocalizedString(option.name, locale)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderInput={params => (
        <TextField {...params} label={label} error={error} helperText={helperText} fullWidth />
      )}
    />
  );
}
