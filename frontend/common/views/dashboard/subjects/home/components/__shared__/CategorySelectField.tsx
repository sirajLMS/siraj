"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { CategoryItem } from "@/frontend/common/views/dashboard/subjects/home/types";

interface CategorySelectFieldProps<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly label: string;
  readonly placeholder: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly categories: readonly CategoryItem[];
}

/**
 * Renders the `categoryId` selector (outlined `Select` with MUI `InputLabel`)
 * listing available categories.
 */
export function CategorySelectField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  error,
  disabled,
  categories,
}: Readonly<CategorySelectFieldProps<T>>) {
  const labelId = `${name}-label`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth required error={!!error} disabled={disabled} sx={outlinedInputSx}>
          <InputLabel id={labelId} shrink>
            {label}
          </InputLabel>
          <Select {...field} labelId={labelId} label={label} displayEmpty>
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id ?? ""}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
          {error ? <FormHelperText>{error}</FormHelperText> : null}
        </FormControl>
      )}
    />
  );
}
