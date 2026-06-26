"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type { UseFormSetValue } from "react-hook-form";
import { labelSx, standardInputSx } from "@/frontend/components/ui/form";
import type { StudentGroup } from "./types";
import type { RecurringClassFormData } from "./recurringClassSchema";

interface StudentGroupSelectProps {
  readonly value: string;
  readonly studentGroups: readonly StudentGroup[];
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly label: string;
  readonly placeholder: string;
  readonly error?: string;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
}

export function StudentGroupSelect({
  value,
  studentGroups,
  isSubmitting,
  isMobile,
  label,
  placeholder,
  error,
  setValue,
}: StudentGroupSelectProps) {
  return (
    <>
      <Typography component="label" sx={labelSx}>
        {label}
      </Typography>
      <FormControl fullWidth error={!!error} variant={isMobile ? "outlined" : "standard"}>
        {isMobile && <InputLabel id="student-group-label">{placeholder}</InputLabel>}
        <Select
          labelId="student-group-label"
          value={value}
          label={isMobile ? placeholder : undefined}
          displayEmpty
          disabled={isSubmitting}
          onChange={e => {
            setValue("studentGroupId", e.target.value, { shouldValidate: true });
          }}
          IconComponent={ExpandMoreOutlined}
          variant={isMobile ? "outlined" : "standard"}
          sx={isMobile ? { borderRadius: 3 } : standardInputSx}
        >
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
          {studentGroups.map(group => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </>
  );
}
