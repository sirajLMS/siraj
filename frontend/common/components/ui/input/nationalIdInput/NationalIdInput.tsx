"use client";

import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { type FC, type ReactNode, useState } from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import { PhoneCountryPicker } from "@/frontend/common/components/ui/input/phoneInput";
import { type NationalIdInputValue, useNationalIdInput } from "@/frontend/common/hooks/useNationalIdInput";
import { LtrScope } from "@/frontend/common/providers/theme/LtrScope";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { isValidNationalId } from "@/shared/lib/national-id";
import { Translation, useAppTranslation } from "@/shared/locale";

export type NationalIdInputProps = {
  readonly value: NationalIdInputValue;
  readonly onChangeAction: (value: NationalIdInputValue) => void;
  readonly onBlurAction?: () => void;
  readonly defaultCountry?: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly hideLabel?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly size?: "small" | "medium";
};

/**
 * Flag button for the country-selector start adornment. When the input is
 * disabled the button is wrapped in a plain `<span>` so the tooltip still
 * shows on hover (MUI suppresses pointer events on disabled buttons).
 */
const CountrySelectorButton: FC<{
  readonly emoji: string | undefined;
  readonly label: string;
  readonly open: boolean;
  readonly disabled: boolean | undefined;
  readonly onToggle: () => void;
}> = ({ emoji, label, open, disabled, onToggle }) => {
  const button = (
    <IconButton
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={onToggle}
      disabled={disabled}
      size="small"
      sx={{ p: 0.25, flexShrink: 0, paddingInlineEnd: 0.5 }}
    >
      <LocaleEmoji emoji={emoji ?? "\u{1F310}"} />
    </IconButton>
  );

  return (
    <Tooltip title={label}>
      {disabled ? (
        <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      ) : (
        button
      )}
    </Tooltip>
  );
};

/**
 * National ID input with a country-selector start adornment — mirrors the
 * `PhoneInput` UX (flag button opens the attached country picker) but the
 * value is an object `{ countryCode, number }` instead of an E.164 string,
 * and there is no dial-code prefix slot.
 */
export const NationalIdInput: FC<NationalIdInputProps> = ({
  value,
  onChangeAction,
  onBlurAction,
  defaultCountry = "EG",
  label,
  placeholder,
  required,
  disabled,
  fullWidth = true,
  error,
  helperText,
  hideLabel,
  sx,
  size,
}): ReactNode => {
  const t = useAppTranslation(Translation.Ui.NationalIdInput);
  const { country, number, handleNumberChange, handleCountrySelect } = useNationalIdInput({
    value,
    onChangeAction,
    defaultCountry,
  });

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const isEmpty = number.length === 0;
  const showRequiredError = Boolean(required) && isEmpty;
  // Live format feedback via the shared canonical validator; Zod-driven
  // caller errors (passed as error/helperText) always take precedence.
  const nationalIdInvalid = !isEmpty && !isValidNationalId({ countryCode: country?.code.toString() ?? null, number });
  const showError = Boolean(error) || showRequiredError || nationalIdInvalid;

  let resolvedHelperText = helperText;
  if (!resolvedHelperText) {
    if (showRequiredError) {
      resolvedHelperText = t.required;
    } else if (nationalIdInvalid) {
      resolvedHelperText = t.invalid;
    }
  }
  const resolvedLabel = hideLabel ? undefined : (label ?? t.label);

  const startAdornment = (
    <InputAdornment position="start" sx={{ marginInlineEnd: 0.5, maxHeight: "unset" }}>
      <CountrySelectorButton
        emoji={country?.emoji}
        label={t.selectCountry}
        open={countryPickerOpen}
        disabled={disabled}
        onToggle={() => setCountryPickerOpen(open => !open)}
      />
    </InputAdornment>
  );

  return (
    <ClickAwayListener onClickAway={() => setCountryPickerOpen(false)}>
      <Box sx={{ width: fullWidth ? "100%" : undefined }}>
        <Box sx={{ position: "relative" }}>
          <LtrScope>
            <TextField
              fullWidth={fullWidth}
              required={required}
              disabled={disabled}
              error={showError}
              label={resolvedLabel}
              placeholder={placeholder}
              size={size}
              value={number}
              onChange={event => handleNumberChange(event.target.value)}
              onBlur={onBlurAction}
              sx={mergeSx(
                { "& .MuiInputBase-input": { paddingInlineStart: 0 } },
                countryPickerOpen
                  ? {
                      "& .MuiOutlinedInput-root": {
                        borderBottomStartRadius: 0,
                        borderBottomEndRadius: 0,
                      },
                    }
                  : undefined,
                sx
              )}
              slotProps={{
                inputLabel: { shrink: true },
                input: { startAdornment },
                htmlInput: {
                  autoComplete: "off",
                  inputMode: "numeric",
                  "aria-label": t.nationalIdNumber,
                },
              }}
            />
          </LtrScope>
          {countryPickerOpen ? <PhoneCountryPicker country={country} onSelectAction={handleCountrySelect} /> : null}
        </Box>
        {!countryPickerOpen && resolvedHelperText ? (
          <FormHelperText error={showError}>{resolvedHelperText}</FormHelperText>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
};
