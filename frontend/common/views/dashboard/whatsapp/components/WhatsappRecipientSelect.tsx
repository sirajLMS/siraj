"use client";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export interface WhatsappRecipientSelectProps {
  readonly label: string;
  readonly placeholder: string;
  readonly phones: readonly string[];
  readonly value: string;
  readonly onChange: (phone: string) => void;
}

/**
 * Recipient selector restricted to a fixed phone list (the local test-number
 * registry): outlined small control with a floating label, a disabled
 * placeholder row, and LTR-isolated rows since registry targets are E.164
 * numbers.
 */
export function WhatsappRecipientSelect({
  label,
  placeholder,
  phones,
  value,
  onChange,
}: Readonly<WhatsappRecipientSelectProps>) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="whatsapp-recipient-select">{label}</InputLabel>
      <Select
        labelId="whatsapp-recipient-select"
        value={value}
        label={label}
        displayEmpty
        onChange={event => onChange(event.target.value)}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {phones.map(phone => (
          <MenuItem key={phone} value={phone} dir="ltr" sx={{ unicodeBidi: "isolate" }}>
            {phone}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
