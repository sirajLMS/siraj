"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { useMemo } from "react";
import type { IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  fromGraphqlIanaTimezone,
  getTimezoneOptions,
  type TimezoneOption,
  toGraphqlIanaTimezone,
} from "@/frontend/lib/timezone";

export type TimezoneSelectProps = {
  readonly value: IanaTimezone | null;
  readonly onChangeAction: (timezone: IanaTimezone | null) => void;
  readonly onBlurAction?: () => void;
  readonly label?: string;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly autoComplete?: string;
  readonly style?: React.CSSProperties;
};

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChangeAction,
  onBlurAction,
  label,
  required,
  fullWidth,
  disabled,
  autoComplete = "off",
  style,
}: TimezoneSelectProps): React.ReactNode => {
  const t = useTranslations("ui.timezoneSelect");
  const locale = useLocale();

  const options = useMemo(() => getTimezoneOptions(locale), [locale]);

  const selectedOption = useMemo(() => {
    if (!value) {
      return null;
    }
    const optionId = fromGraphqlIanaTimezone(value);
    return options.find(option => option.id === optionId) ?? null;
  }, [options, value]);

  return (
    <Autocomplete<TimezoneOption, false, false, false>
      fullWidth={fullWidth}
      options={options}
      autoHighlight
      disabled={disabled}
      value={selectedOption}
      sx={{ ...style }}
      onChange={(_, newValue) => {
        onChangeAction(newValue ? toGraphqlIanaTimezone(newValue.id) : null);
      }}
      onBlur={onBlurAction}
      isOptionEqualToValue={(option, optionValue) => option.id === optionValue.id}
      getOptionLabel={option => option.label}
      renderInput={params => (
        <TextField
          {...params}
          label={label ?? t("selectTimezone")}
          required={required}
          onBlur={onBlurAction}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              autoComplete,
            },
          }}
        />
      )}
    />
  );
};
