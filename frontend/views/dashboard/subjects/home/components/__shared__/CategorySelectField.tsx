"use client";

import { MenuItem, Select } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import type { CategoryItem } from "../../types";

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
 * Renders the `categoryId` selector (a standard-variant `Select` listing the
 * available categories) wrapped in a `FieldWrapper`.
 *
 * Extracted from CreateSubjectDialog and EditSubjectDialog which previously
 * duplicated the entire Controller/Select/MenuItem mapping block.
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
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FieldWrapper label={label} required error={error}>
          <Select
            {...field}
            fullWidth
            variant="standard"
            error={!!error}
            disabled={disabled}
            displayEmpty
            sx={standardInputSx}
          >
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id ?? ""}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FieldWrapper>
      )}
    />
  );
}
