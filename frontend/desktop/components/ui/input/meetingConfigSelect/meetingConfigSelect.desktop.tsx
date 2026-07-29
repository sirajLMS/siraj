"use client";

import { Autocomplete, TextField } from "@mui/material";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export type MeetingConfigSelectOption = {
  readonly id: string;
  readonly label: string | null;
  readonly provider: {
    readonly id: string;
    readonly slug: string;
    readonly name: Partial<Record<"ar" | "en", string>> | null;
    readonly logoUrl: string | null;
  } | null;
  readonly isDefault: boolean | null;
};

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

export function MeetingConfigSelectDesktop({
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
  const t = useAppTranslation(Translation.Ui.MeetingConfig).classScope;
  const locale = useAppLocale();
  const resolvedLabel = label ?? t.selectLabel;
  const resolvedPlaceholder = placeholder ?? t.selectPlaceholder;
  const resolvedEmptyLabel = emptyOptionLabel ?? t.useTeacherDefault;

  const autocompleteOptions = allowEmpty
    ? [{ id: "", label: resolvedEmptyLabel, provider: null, isDefault: false }, ...options]
    : options;

  const selectedValue =
    value ?? (allowEmpty ? { id: "", label: resolvedEmptyLabel, provider: null, isDefault: false } : null);

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
