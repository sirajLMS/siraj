"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { EntitySelectProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export function EntitySelectDesktop({
  value,
  entities,
  isSubmitting,
  label,
  placeholder,
  error,
  onChange,
}: EntitySelectProps) {
  const labelId = `select-label-${label}`;

  return (
    <FormControl fullWidth error={!!error} sx={outlinedInputSx}>
      <InputLabel id={labelId} shrink>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        displayEmpty
        disabled={isSubmitting}
        onChange={e => {
          onChange(e.target.value);
        }}
        IconComponent={ExpandMoreOutlined}
        variant="outlined"
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {entities.map(entity => (
          <MenuItem key={entity.id} value={entity.id}>
            {entity.name}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
