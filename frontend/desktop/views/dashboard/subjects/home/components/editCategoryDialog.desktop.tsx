"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { ClassCategoryUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EditCategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { EditCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

function TextFieldController({
  name,
  control,
  label,
  required,
  error,
  disabled,
  multiline,
  rows,
}: Readonly<{
  name: keyof EditCategoryFormValues & ("name" | "slug" | "description");
  control: Control<EditCategoryFormValues>;
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          required={required}
          error={!!error}
          helperText={error}
          multiline={multiline}
          rows={rows}
          disabled={disabled}
          sx={outlinedInputSx}
        />
      )}
    />
  );
}

function CategoryFormFields({
  control,
  errors,
  labels,
  disabled,
}: Readonly<{
  control: Control<EditCategoryFormValues>;
  errors: FieldErrors<EditCategoryFormValues>;
  labels: EditCategoryDialogProps["labels"];
  disabled: boolean;
}>) {
  return (
    <>
      <TextFieldController
        name="name"
        control={control}
        label={labels.nameLabel}
        required
        error={errors.name ? labels.nameRequired : undefined}
        disabled={disabled}
      />
      <TextFieldController
        name="slug"
        control={control}
        label={labels.slugLabel}
        required
        error={errors.slug ? labels.slugRequired : undefined}
        disabled={disabled}
      />
      <TextFieldController
        name="description"
        control={control}
        label={labels.descriptionLabel}
        disabled={disabled}
        multiline
        rows={3}
      />
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Switch checked={field.value ?? true} onChange={field.onChange} disabled={disabled} />
            <Typography variant="bodyMd">{labels.activeLabel}</Typography>
          </Box>
        )}
      />
    </>
  );
}

const FORM_ID = "edit-category-form-desktop";

/**
 * EditCategoryDialogDesktop — `sm`-width centered edit-category dialog with an
 * inline horizontal action row.
 *
 * NEW FOR PLAN v5: form state (useForm/useWatch/useEffect/zodResolver/
 * inline z.object) lifted to ViewModel. Pure prop passdown here.
 */
export function EditCategoryDialogDesktop({
  open,
  onClose,
  onSubmit,
  category,
  isLoading,
  form,
  labels,
}: Readonly<EditCategoryDialogProps>) {
  const { control, errors, handleSubmit } = form;

  const handleFormSubmit = (data: EditCategoryFormValues) => {
    if (!category?.id) return;
    const input: ClassCategoryUpdateInput = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
    };
    onSubmit(category.id, input);
  };

  if (!category) return null;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="edit-category-dialog-title-desktop"
    >
      <DialogTitle id="edit-category-dialog-title-desktop">{labels.editCategory}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id={FORM_ID}
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <CategoryFormFields control={control} errors={errors} labels={labels} disabled={isLoading} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="text"
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontWeight: 700,
            borderRadius: 1.5,
          })}
        >
          {labels.cancel}
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          disabled={isLoading}
          variant="contained"
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          {isLoading ? "..." : labels.saveChanges}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
