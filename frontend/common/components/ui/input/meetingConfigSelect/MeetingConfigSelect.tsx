"use client";

import { Autocomplete, TextField } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { MeetingConfigSelectOption } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";

export type MeetingConfigSelectProps = {
  readonly options: readonly MeetingConfigSelectOption[];
  readonly value: MeetingConfigSelectOption | null;
  readonly onChangeAction: (option: MeetingConfigSelectOption | null) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly allowEmpty?: boolean;
  readonly emptyOptionLabel?: string;
};

function formatOptionLabel(option: MeetingConfigSelectOption, locale: string): string {
  const providerName = option.provider?.name
    ? resolveLocalizedString(option.provider.name, locale)
    : (option.provider?.slug ?? "");
  const label = option.label?.trim();
  if (label && providerName) return `${providerName} — ${label}`;
  return label || providerName || option.id;
}

export function MeetingConfigSelect({
  options,
  value,
  onChangeAction,
  label,
  placeholder,
  disabled,
  loading,
  allowEmpty = false,
  emptyOptionLabel,
}: MeetingConfigSelectProps) {
  const t = useTranslations("ui.meetingConfig.classScope");
  const locale = useLocale();
  const resolvedLabel = label ?? t("selectLabel");
  const resolvedPlaceholder = placeholder ?? t("selectPlaceholder");
  const resolvedEmptyLabel = emptyOptionLabel ?? t("useTeacherDefault");

  const autocompleteOptions = allowEmpty
    ? [{ id: "", label: resolvedEmptyLabel, provider: null, isDefault: false }, ...options]
    : options;

  const selectedValue =
    value ??
    (allowEmpty
      ? ({ id: "", label: resolvedEmptyLabel, provider: null, isDefault: false } as MeetingConfigSelectOption)
      : null);

  return (
    <Autocomplete
      options={autocompleteOptions}
      value={selectedValue}
      loading={loading}
      disabled={disabled}
      getOptionLabel={option => formatOptionLabel(option, locale)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_event, option) => {
        if (!option || (allowEmpty && option.id === "")) {
          onChangeAction(null);
          return;
        }
        onChangeAction(option);
      }}
      renderInput={params => (
        <TextField {...params} label={resolvedLabel} placeholder={resolvedPlaceholder} size="small" fullWidth />
      )}
    />
  );
}
