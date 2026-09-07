"use client";

import { Box, MenuItem, TextField } from "@mui/material";
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
  /** Purpose-specific guidance rendered as a secondary line below the helper text. */
  readonly description?: string | null;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

export function WhatsappPurposeSelect({
  labels,
  value,
  error,
  description,
  disabled,
  onChange,
}: WhatsappPurposeSelectProps) {
  const helperContent = (
    <>
      {error ?? labels.purposeHelper}
      {description ? (
        <Box component="span" sx={{ display: "block", mt: 0.5, color: theme => theme.palette.text.secondary }}>
          {description}
        </Box>
      ) : null}
    </>
  );

  return (
    <TextField
      select
      label={labels.purposeLabel}
      value={value}
      onChange={e => onChange(e.target.value)}
      error={error !== null}
      helperText={helperContent}
      aria-invalid={error !== null}
      fullWidth
      disabled={disabled}
      sx={{
        "& .MuiOutlinedInput-notchedOutline legend > span": {
          paddingInline: 0.75,
        },
      }}
    >
      {getPurposeOptions(labels).map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
