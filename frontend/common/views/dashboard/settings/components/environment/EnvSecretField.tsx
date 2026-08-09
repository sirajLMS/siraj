"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useEnvironmentConfigSettingsStore } from "@/frontend/common/stores/environmentConfigSettingsStore";

type EnvSecretFieldProps = {
  readonly configKey: string;
  readonly label: string;
  readonly value: string;
  readonly onChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly isSecret: boolean;
  readonly placeholder?: string;
  readonly showValueLabel: string;
  readonly hideValueLabel: string;
};

const HIDDEN_SECRET_PLACEHOLDER = "••••••••";

export function EnvSecretField({
  configKey,
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  isSecret,
  placeholder,
  showValueLabel,
  hideValueLabel,
}: Readonly<EnvSecretFieldProps>) {
  const revealed = useEnvironmentConfigSettingsStore(state =>  state.revealedKeys[configKey]);
  const toggleSecretRevealed = useEnvironmentConfigSettingsStore(state => state.toggleSecretRevealed);

  if (!isSecret) {
    return (
      <TextField
        label={label}
        value={value}
        onChange={event => onChange?.(event.target.value)}
        disabled={disabled}
        fullWidth
        size="small"
        slotProps={{
          input: {
            readOnly,
          },
        }}
      />
    );
  }

  if (readOnly) {
    const displayValue = revealed ? value || placeholder || HIDDEN_SECRET_PLACEHOLDER : HIDDEN_SECRET_PLACEHOLDER;

    return (
      <TextField
        label={label}
        value={displayValue}
        disabled={disabled}
        fullWidth
        size="small"
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={revealed ? hideValueLabel : showValueLabel}
                  onClick={() => {
                    toggleSecretRevealed(configKey);
                  }}
                  disabled={disabled}
                >
                  {revealed ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  }

  return (
    <TextField
      label={label}
      value={value}
      onChange={event => onChange?.(event.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      fullWidth
      size="small"
      type={revealed ? "text" : "password"}
      autoComplete="off"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                aria-label={revealed ? hideValueLabel : showValueLabel}
                onClick={() => {
                  toggleSecretRevealed(configKey);
                }}
                disabled={disabled}
              >
                {revealed ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
