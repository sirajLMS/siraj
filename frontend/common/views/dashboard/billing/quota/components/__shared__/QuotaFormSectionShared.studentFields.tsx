import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { StudentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StudentAutocomplete";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type { SectionFieldProps } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.types";

export function StudentInfoFields({
  control,
  errors,
  labels,
  isEditing,
  fieldAccess,
}: Readonly<Pick<SectionFieldProps, "control" | "errors" | "labels" | "isEditing" | "fieldAccess">>) {
  if (isEditing) {
    return (
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label={labels.fields.name}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            required
            disabled={fieldAccess.name.disabled}
            sx={{ mb: 2 }}
          />
        )}
      />
    );
  }

  return (
    <>
      <Controller
        name="studentId"
        control={control}
        render={({ field }) => (
          <StudentAutocomplete
            value={field.value ? { id: field.value, name: field.value } : null}
            onChange={(next: PersonOption | null) => field.onChange(next?.id ?? "")}
            label={labels.fields.student}
            placeholder={labels.fields.studentPickerPlaceholder}
            error={Boolean(errors.studentId)}
            helperText={fieldAccess.studentId.helperText ?? errors.studentId?.message}
            required
            disabled={fieldAccess.studentId.disabled}
            fullWidth
            sx={{ mb: 2 }}
          />
        )}
      />
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label={labels.fields.name}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            required
            disabled={fieldAccess.name.disabled}
          />
        )}
      />
    </>
  );
}
