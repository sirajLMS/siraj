"use client";

import { MenuItem, TextField } from "@mui/material";
import { getPurposeOptions } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface WhatsappPurposeSelectProps {
  readonly labels: Pick<
    WhatsappLabels,
    "purposeLabel" | "purposeHelper" | "purposeGeneral" | "purposeAdvertising" | "purposeStudents"
  >;
  /** Raw select value (empty string when nothing chosen). */
  readonly value: string;
  /** Localized validation message, or null when the field is valid. */
  readonly error: string | null;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

export function WhatsappPurposeSelect({ labels, value, error, disabled, onChange }: WhatsappPurposeSelectProps) {
  return (
    <TextField
      select
      label={labels.purposeLabel}
      value={value}
      onChange={e => onChange(e.target.value)}
      error={error !== null}
      helperText={error ?? labels.purposeHelper}
      aria-invalid={error !== null}
      fullWidth
      disabled={disabled}
    >
      {getPurposeOptions(labels).map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
