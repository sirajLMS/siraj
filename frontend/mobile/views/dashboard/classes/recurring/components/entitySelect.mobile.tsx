"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { labelSx } from "@/frontend/common/components/ui/form";
import type { SimpleEntity } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface EntitySelectMobileProps {
  readonly value: string;
  readonly entities: readonly SimpleEntity[];
  readonly isSubmitting: boolean;
  readonly label: string;
  readonly placeholder: string;
  readonly error?: string;
  readonly onChange: (value: string) => void;
}

export function EntitySelectMobile({
  value,
  entities,
  isSubmitting,
  label,
  placeholder,
  error,
  onChange,
}: EntitySelectMobileProps) {
  return (
    <>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <FormControl fullWidth error={!!error} variant="outlined">
        <InputLabel id={`select-label-${label}`}>{placeholder}</InputLabel>
        <Select
          labelId={`select-label-${label}`}
          value={value}
          label={placeholder}
          displayEmpty
          disabled={isSubmitting}
          onChange={e => {
            onChange(e.target.value);
          }}
          IconComponent={ExpandMoreOutlined}
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
          {entities.map(entity => (
            <MenuItem key={entity.id} value={entity.id}>
              {entity.name}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </>
  );
}
