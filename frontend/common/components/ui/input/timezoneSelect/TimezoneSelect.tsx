"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useMemo } from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import type { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  fromGraphqlIanaTimezone,
  getTimezoneOptions,
  type TimezoneOption,
  toGraphqlIanaTimezone,
} from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  readonly error?: boolean;
  readonly helperText?: string;
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
  error,
  helperText,
}: TimezoneSelectProps): React.ReactNode => {
  const t = useAppTranslation(Translation.Ui.TimezoneSelect);
  const locale = useAppLocale();

  const options = useMemo(() => getTimezoneOptions(locale), [locale]);

  const selectedOption = useMemo(() => {
    if (!value) {
      return null;
    }
    const optionId = fromGraphqlIanaTimezone(value);
    return options.find(option => option.id === optionId) ?? null;
  }, [options, value]);

  const showRequiredError = Boolean(required) && !value;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);

  return (
    <Autocomplete<TimezoneOption>
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
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }} {...optionProps}>
            <LocaleEmoji emoji={option.emoji} />
            <Typography component="span" variant="bodyMd">
              {option.pathLabel}
            </Typography>
            <Typography component="span" variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              ({option.offsetLabel})
            </Typography>
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label ?? t.selectTimezone}
          required={required}
          error={showError}
          helperText={resolvedHelperText}
          onBlur={onBlurAction}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: selectedOption ? (
                <>
                  <InputAdornment position="start">
                    <LocaleEmoji emoji={selectedOption.emoji} />
                  </InputAdornment>
                  {params.slotProps.input?.startAdornment}
                </>
              ) : (
                params.slotProps.input?.startAdornment
              ),
            },
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
