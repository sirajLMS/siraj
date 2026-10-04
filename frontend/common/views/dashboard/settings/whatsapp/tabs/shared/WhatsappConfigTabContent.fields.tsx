import { TextField } from "@mui/material";
import { useState } from "react";
import { SecretTextField } from "@/frontend/common/components/ui/input/secretTextField";
import type { WhatsappConfigValidationKey } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

interface ConfigFieldProps {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly errorKey: WhatsappConfigValidationKey | null | undefined;
  /** Mirrored server cap for the field — the browser blocks longer input. */
  readonly maxLength?: number;
  readonly labels: WhatsappLabels;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

/** Plain text field that swaps its helper for the localized validation message. */
export function ConfigField({
  label,
  value,
  helper,
  errorKey,
  maxLength,
  labels,
  disabled,
  onChange,
}: Readonly<ConfigFieldProps>) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
      helperText={errorKey ? labels[errorKey] : helper}
      error={Boolean(errorKey)}
      disabled={disabled}
      fullWidth
      autoComplete="off"
      slotProps={{ htmlInput: { maxLength } }}
    />
  );
}

interface ConfigSecretFieldProps {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly errorKey?: WhatsappConfigValidationKey | null;
  /** Mirrored server cap for the field — the browser blocks longer input. */
  readonly maxLength: number;
  readonly labels: WhatsappLabels;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

/** Masked secret input with a reveal toggle; the stored value stays server-masked. */
export function ConfigSecretField({
  label,
  value,
  helper,
  errorKey,
  maxLength,
  labels,
  disabled,
  onChange,
}: Readonly<ConfigSecretFieldProps>) {
  const [revealed, setRevealed] = useState(false);

  return (
    <SecretTextField
      label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
      helperText={errorKey ? labels[errorKey] : helper}
      error={Boolean(errorKey)}
      disabled={disabled}
      maxLength={maxLength}
      revealed={revealed}
      onToggleReveal={() => setRevealed(previous => !previous)}
      showValueLabel={labels.configShowSecret}
      hideValueLabel={labels.configHideSecret}
    />
  );
}
