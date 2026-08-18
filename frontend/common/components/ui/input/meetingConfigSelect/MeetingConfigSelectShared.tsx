"use client";

import { Autocomplete, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { MeetingConfigSelectOption } from "@/frontend/common/components/ui/input/meetingConfigSelect/types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface MeetingConfigSelectSharedSlots {
  /** When true, the Autocomplete fills its container width (mobile full-width usage). */
  readonly fullWidth?: boolean;
  /** Extra sx override forwarded onto the Autocomplete (tier chrome adjustments). */
  readonly autocompleteSx?: SxProps<Theme>;
}

export type MeetingConfigSelectSharedProps = {
  readonly options: readonly MeetingConfigSelectOption[];
  readonly value: MeetingConfigSelectOption | null;
  readonly onChangeAction: (option: MeetingConfigSelectOption | null) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly allowEmpty?: boolean;
  readonly emptyOptionLabel?: string;
} & MeetingConfigSelectSharedSlots;

function formatOptionLabel(option: MeetingConfigSelectOption, locale: string): string {
  const providerName = option.provider?.name
    ? resolveLocalizedString(option.provider.name, locale)
    : (option.provider?.slug ?? "");
  const label = option.label?.trim();
  if (label && providerName) return `${providerName} — ${label}`;
  return label ?? providerName ?? option.id;
}

export function MeetingConfigSelectShared({
  options,
  value,
  onChangeAction,
  label,
  placeholder,
  disabled,
  loading,
  allowEmpty = false,
  emptyOptionLabel,
  fullWidth,
  autocompleteSx,
}: Readonly<MeetingConfigSelectSharedProps>): React.ReactNode {
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
      fullWidth={fullWidth}
      options={autocompleteOptions}
      value={selectedValue}
      loading={loading}
      disabled={disabled}
      sx={autocompleteSx}
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
