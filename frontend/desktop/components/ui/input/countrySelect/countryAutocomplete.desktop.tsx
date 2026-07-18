"use client";

import type { AutocompleteProps } from "@mui/material/Autocomplete";
import Autocomplete, { type AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import type { Modifier } from "@popperjs/core";
import type * as React from "react";
import { useCallback, useState } from "react";
import { getCountryOptionLabel } from "@/frontend/common/components/ui/input/countrySelect/countryOptionRow.utils";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { CountryOptionRowDesktop } from "@/frontend/desktop/components/ui/input/countrySelect/countryOptionRow.desktop";
import { useAppTranslation } from "@/shared/locale";

type CountryAutocompleteSlotProps = NonNullable<AutocompleteProps<CountryType, false, false, false>["slotProps"]>;

const sameWidthModifier: Modifier<"sameWidth", Record<string, unknown>> = {
  name: "sameWidth",
  enabled: true,
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: ({ state }) => {
    const anchor = state.rects.reference;
    if (anchor) {
      state.styles.popper = {
        ...state.styles.popper,
        width: `${anchor.width}px`,
        minWidth: `${anchor.width}px`,
      };
    }
  },
};

function getCountryAutocompletePopperSlotProps(options: {
  readonly matchAnchorWidth: boolean;
  readonly disablePortal: boolean;
  readonly listAttached: boolean;
}): NonNullable<CountryAutocompleteSlotProps["popper"]> {
  const { matchAnchorWidth, disablePortal, listAttached } = options;

  return {
    disablePortal,
    placement: "bottom-start",
    modifiers: matchAnchorWidth
      ? [
          sameWidthModifier,
          {
            name: "offset",
            options: {
              offset: [0, listAttached ? 0 : 4],
            },
          },
        ]
      : [
          {
            name: "offset",
            options: {
              offset: [0, listAttached ? 0 : 4],
            },
          },
        ],
    sx: matchAnchorWidth
      ? {
          width: "fit-content",
          minWidth: "fit-content",
        }
      : undefined,
  };
}

function getCountryAutocompletePaperSlotProps(listAttached: boolean): CountryAutocompleteSlotProps["paper"] {
  if (!listAttached) {
    return undefined;
  }

  return {
    sx: (theme: Theme) => ({
      mt: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderTopWidth: 0,
      boxShadow: theme.shadows[4],
    }),
  };
}

const buildSxProp = (
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties => ({
  ...style,
  ...(listAttached && {
    "& .MuiOutlinedInput-root": {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      ...(isOpen && {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }),
    },
  }),
});

interface RenderInputConfig {
  readonly params: AutocompleteRenderInputParams;
  readonly listAttached: boolean;
  readonly label: string | undefined;
  readonly selectCountryLabel: string;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly helperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoFocus: boolean | undefined;
  readonly autoComplete: string;
  readonly country: CountryType | null | undefined;
}

const renderCountryInput = (config: RenderInputConfig): React.ReactNode => {
  const {
    params,
    listAttached,
    label,
    selectCountryLabel,
    required,
    showError,
    helperText,
    onBlur,
    autoFocus,
    autoComplete,
    country,
  } = config;
  const resolvedLabel = listAttached ? undefined : (label ?? selectCountryLabel);
  const resolvedPlaceholder = listAttached ? (label ?? selectCountryLabel) : undefined;

  return (
    <TextField
      {...params}
      label={resolvedLabel}
      placeholder={resolvedPlaceholder}
      required={required}
      error={showError}
      helperText={helperText}
      onBlur={onBlur}
      autoFocus={autoFocus}
      slotProps={{
        ...params.slotProps,
        input: {
          ...params.slotProps.input,
          startAdornment: country ? (
            <>
              <InputAdornment position="start">
                <DesktopLocaleEmoji emoji={country.emoji} />
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

export const CountryAutocompleteDesktop: React.FC<CountryAutocompleteProps> = ({
  country,
  onChangeAction,
  onClearAction,
  autoComplete = "country",
  fullWidth,
  required,
  disabled,
  label,
  error,
  helperText,
  onBlurAction: onBlur,
  style,
  open: openProp,
  onOpenAction,
  onCloseAction,
  autoFocus,
  showPhonePrefix = true,
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
}: CountryAutocompleteProps): React.ReactNode => {
  const t = useAppTranslation().uiTranslations.countrySelect;
  const locale = useAppLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const getOptionLabel = useCallback(
    (option: CountryType) => getCountryOptionLabel(option, locale, showPhonePrefix),
    [locale, showPhonePrefix]
  );

  const showRequiredError = Boolean(required) && !country;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t.required : undefined);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={countries}
      autoHighlight
      disabled={disabled}
      open={isOpen}
      onOpen={() => {
        if (openProp === undefined) {
          setInternalOpen(true);
        }
        onOpenAction?.();
      }}
      onClose={() => {
        if (openProp === undefined) {
          setInternalOpen(false);
        }
        onCloseAction?.();
      }}
      value={country ?? null}
      sx={buildSxProp(style, listAttached, isOpen)}
      onChange={(_, newValue) => {
        if (newValue) {
          onChangeAction(newValue);
        } else if (onClearAction) {
          onClearAction();
        }
      }}
      onBlur={onBlur}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={getOptionLabel}
      slotProps={{
        popper: getCountryAutocompletePopperSlotProps({
          matchAnchorWidth,
          disablePortal: disablePortal || listAttached,
          listAttached,
        }),
        paper: getCountryAutocompletePaperSlotProps(listAttached),
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
            <CountryOptionRowDesktop country={option} locale={locale} showPhonePrefix={showPhonePrefix} />
          </Box>
        );
      }}
      renderInput={params =>
        renderCountryInput({
          params,
          listAttached,
          label,
          selectCountryLabel: t.selectCountry,
          required,
          showError,
          helperText: resolvedHelperText,
          onBlur,
          autoFocus,
          autoComplete,
          country,
        })
      }
    />
  );
};
