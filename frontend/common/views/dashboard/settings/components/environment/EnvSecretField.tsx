"use client";

import { TextField } from "@mui/material";
import { SecretTextField } from "@/frontend/common/components/ui/input";
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
  const revealed = useEnvironmentConfigSettingsStore(state => state.revealedKeys[configKey]);
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

  return (
    <SecretTextField
      label={label}
      value={value}
      onChange={event => onChange?.(event.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      autoComplete="off"
      revealed={revealed ?? false}
      onToggleReveal={() => {
        toggleSecretRevealed(configKey);
      }}
      showValueLabel={showValueLabel}
      hideValueLabel={hideValueLabel}
    />
  );
}
