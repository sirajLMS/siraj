"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { labelSx, standardInputSx } from "@/frontend/components/ui/form";
import type { SimpleEntity } from "./types";

interface EntitySelectProps {
  readonly value: string;
  readonly entities: readonly SimpleEntity[];
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly label: string;
  readonly placeholder: string;
  readonly error?: string;
  readonly onChange: (value: string) => void;
}

export function EntitySelect({
  value,
  entities,
  isSubmitting,
  isMobile,
  label,
  placeholder,
  error,
  onChange,
}: EntitySelectProps) {
  return (
    <>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <FormControl fullWidth error={!!error} variant={isMobile ? "outlined" : "standard"}>
        {isMobile && <InputLabel id={`select-label-${label}`}>{placeholder}</InputLabel>}
        <Select
          labelId={`select-label-${label}`}
          value={value}
          label={isMobile ? placeholder : undefined}
          displayEmpty
          disabled={isSubmitting}
          onChange={e => {
            onChange(e.target.value);
          }}
          IconComponent={ExpandMoreOutlined}
          variant={isMobile ? "outlined" : "standard"}
          sx={isMobile ? { borderRadius: 3 } : standardInputSx}
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
