"use client";

import { useQuery } from "@apollo/client/react";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { classSubjectsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";

export interface SubjectSelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly placeholder: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly name?: string;
}

/**
 * Standalone subject selector (value/onChange) loading active subjects via
 * the classSubjects GraphQL query.
 */
export function SubjectSelect({
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled,
  name = "subjectId",
}: Readonly<SubjectSelectProps>) {
  const labelId = `${name}-label`;
  const { data, loading } = useQuery(classSubjectsQueryDocument, {
    variables: { categoryId: null },
  });
  const subjects = (data?.classSubjects ?? []).filter(subject => subject?.isActive !== false && subject?.id);

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
          <MenuItem key={subject?.id ?? ""} value={subject?.id ?? ""}>
            {subject?.name ?? subject?.id}
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
  readonly error?: string;
  readonly disabled?: boolean;
}

/**
 * Required subject selector bound to react-hook-form.
 */
export function SubjectSelectField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
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
          error={error}
          disabled={disabled}
        />
      )}
    />
  );
}
