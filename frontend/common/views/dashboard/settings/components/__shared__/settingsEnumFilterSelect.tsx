import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export type SettingsEnumFilterSelectOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  /** Text direction for bilingual option text (e.g. Arabic account names) — pairs with `unicode-bidi: isolate`. */
  readonly dir?: "ltr" | "auto";
};

export type SettingsEnumFilterSelectProps<T extends string = string> = {
  /** Stable select id — derives the InputLabel labelId for the a11y association. */
  readonly id: string;
  readonly label: string;
  readonly value: T;
  readonly options: readonly SettingsEnumFilterSelectOption<T>[];
  /** Leading "all" option shown first; `value === allValue` selects it. */
  readonly allLabel: string;
  readonly allValue: T;
  readonly onChange: (value: T) => void;
  readonly minWidth?: number;
  readonly fullWidth?: boolean;
  readonly sx?: SxProps<Theme>;
};

/**
 * Shared enum filter select: the FormControl + InputLabel + Select
 * (displayEmpty) trio with a leading "all" option, the shared outlined-input
 * styling, and generated labelId. Settings filter bars pass their labels and
 * options via props so copy stays owned by the caller's namespace.
 */
export function SettingsEnumFilterSelect<T extends string = string>({
  id,
  label,
  value,
  options,
  allLabel,
  allValue,
  onChange,
  minWidth,
  fullWidth = false,
  sx,
}: Readonly<SettingsEnumFilterSelectProps<T>>): ReactNode {
  const labelId = `${id}-label`;
  const isOptionValue = (candidate: string): candidate is T =>
    candidate === allValue || options.some(option => option.value === candidate);
  const filterSx = mergeSx({ minWidth }, outlinedInputSx, sx);
  return (
    <FormControl size="small" fullWidth={fullWidth} sx={filterSx}>
      <InputLabel id={labelId} shrink={value === allValue ? true : undefined}>
        {label}
      </InputLabel>
      <Select<T>
        labelId={labelId}
        label={label}
        value={value}
        displayEmpty
        onChange={(event: SelectChangeEvent<T>) => {
          const next = event.target.value;
          if (isOptionValue(next)) {
            onChange(next);
          }
        }}
      >
        <MenuItem value={allValue}>{allLabel}</MenuItem>
        {options.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
            dir={option.dir}
            sx={option.dir ? { unicodeBidi: "isolate" } : undefined}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
