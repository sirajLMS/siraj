"use client";

import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface SubjectSelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly placeholder: string;
  /** Presentational options projected from the classSubjects query by the owner ViewModel. */
  readonly subjects: readonly ClassSubjectOption[];
  readonly loading?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly name?: string;
}

/**
 * Presentational subject selector. Data fetching lives in the owner ViewModel
 * (`useClassSubjects`); this component only renders the supplied options.
 */
export function SubjectSelect({
  value,
  onChange,
  label,
  placeholder,
  subjects,
  loading,
  error,
  disabled,
  name = "subjectId",
}: Readonly<SubjectSelectProps>) {
  const labelId = `${name}-label`;

  return (
    <FormControl fullWidth required error={!!error} disabled={disabled ?? loading} sx={outlinedInputSx}>
      <InputLabel id={labelId} shrink>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        displayEmpty
        value={value}
        onChange={e => {
          onChange(e.target.value);
        }}
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {subjects.map(subject => (
          <MenuItem key={subject.id} value={subject.id}>
            {subject.name}
          </MenuItem>
        ))}
      </Select>
      {error ? <FormHelperText>{error}</FormHelperText> : null}
    </FormControl>
  );
}

interface SubjectSelectFieldProps<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly control: Control<T>;
  readonly label: string;
  readonly placeholder: string;
  readonly subjects: readonly ClassSubjectOption[];
  readonly loading?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
}

/**
 * Required subject selector bound to react-hook-form. Options are owned by
 * the ViewModel and flow down as props.
 */
export function SubjectSelectField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  subjects,
  loading,
  error,
  disabled,
}: Readonly<SubjectSelectFieldProps<T>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <SubjectSelect
          name={name}
          value={field.value ?? ""}
          onChange={field.onChange}
          label={label}
          placeholder={placeholder}
          subjects={subjects}
          loading={loading}
          error={error}
          disabled={disabled}
        />
      )}
    />
  );
}
