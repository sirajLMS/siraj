"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, MenuItem, Select } from "@mui/material";
import { labelSx, standardInputSx } from "@/frontend/common/components/ui/form";
import type { SimpleEntity } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface EntitySelectDesktopProps {
  readonly value: string;
  readonly entities: readonly SimpleEntity[];
  readonly isSubmitting: boolean;
  readonly label: string;
  readonly placeholder: string;
  readonly error?: string;
  readonly onChange: (value: string) => void;
}

export function EntitySelectDesktop({
  value,
  entities,
  isSubmitting,
  label,
  placeholder,
  error,
  onChange,
}: EntitySelectDesktopProps) {
  return (
    <>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <FormControl fullWidth error={!!error} variant="standard">
        <Select
          labelId={`select-label-${label}`}
          value={value}
          displayEmpty
          disabled={isSubmitting}
          onChange={e => {
            onChange(e.target.value);
          }}
          IconComponent={ExpandMoreOutlined}
          variant="standard"
          sx={standardInputSx}
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
