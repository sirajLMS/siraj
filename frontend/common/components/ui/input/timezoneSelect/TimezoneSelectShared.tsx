"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { useMemo } from "react";
import type {
  LocaleEmojiComponent,
  TimezoneSelectSharedProps,
} from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";
import {
  fromGraphqlIanaTimezone,
  getTimezoneOptions,
  type TimezoneOption,
  toGraphqlIanaTimezone,
} from "@/frontend/common/lib/timezone";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { Translation, useAppTranslation } from "@/shared/locale";

type RenderOptionParams = {
  readonly props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
  readonly option: TimezoneOption;
  readonly LocaleEmojiComponent: LocaleEmojiComponent;
  readonly optionRowSx: SxProps<Theme> | undefined;
};

const renderTimezoneOption = ({
  props,
  option,
  LocaleEmojiComponent,
  optionRowSx,
}: RenderOptionParams): React.ReactNode => {
  const { key, ...optionProps } = props;
  return (
    <Box
      key={key}
      component="li"
      sx={mergeSx({ display: "flex", alignItems: "center", gap: 1 }, optionRowSx)}
      {...optionProps}
    >
      <LocaleEmojiComponent emoji={option.emoji} />
      <Typography component="span" variant="bodyMd">
        {option.pathLabel}
      </Typography>
      <Typography component="span" variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        ({option.offsetLabel})
      </Typography>
    </Box>
  );
};

type RenderInputParams = {
  readonly params: Parameters<NonNullable<React.ComponentProps<typeof Autocomplete<TimezoneOption>>["renderInput"]>>[0];
  readonly resolvedLabel: string;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoComplete: string;
  readonly selectedOption: TimezoneOption | null;
  readonly LocaleEmojiComponent: LocaleEmojiComponent;
};

const renderTimezoneInput = ({
  params,
  resolvedLabel,
  required,
  showError,
  resolvedHelperText,
  onBlur,
  autoComplete,
  selectedOption,
  LocaleEmojiComponent,
}: RenderInputParams): React.ReactNode => {
  return (
    <TextField
      {...params}
      label={resolvedLabel}
      required={required}
      error={showError}
      helperText={resolvedHelperText}
      onBlur={onBlur}
      slotProps={{
        ...params.slotProps,
        input: {
          ...params.slotProps.input,
          startAdornment: selectedOption ? (
            <>
              <InputAdornment position="start">
                <LocaleEmojiComponent emoji={selectedOption.emoji} />
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
  );
};

export const TimezoneSelectShared: React.FC<TimezoneSelectSharedProps> = ({
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
  LocaleEmojiComponent,
  optionRowSx,
}: Readonly<TimezoneSelectSharedProps>): React.ReactNode => {
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
  const resolvedLabel = label ?? t.selectTimezone;

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
      renderOption={(props, option) => renderTimezoneOption({ props, option, LocaleEmojiComponent, optionRowSx })}
      renderInput={params =>
        renderTimezoneInput({
          params,
          resolvedLabel,
          required,
          showError,
          resolvedHelperText,
          onBlur: onBlurAction,
          autoComplete,
          selectedOption,
          LocaleEmojiComponent,
        })
      }
    />
  );
};
