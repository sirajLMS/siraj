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
import type { SxProps, Theme } from "@mui/material/styles";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field/formFieldStyles";
import type { ClassCategoryUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EditCategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { EditCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

/** Slot props that each tier variant provides to customize the dialog shell. */
export interface EditCategoryDialogSlotProps {
  /** Dialog-level props (fullScreen vs sm-width, aria-labelledby, etc.). */
  readonly dialogProps: Readonly<Record<string, unknown>>;
  /** Sx for the DialogActions container (column vs row layout, gap, etc.). */
  readonly actionsSx: SxProps<Theme>;
  /** Whether action buttons should be full-width (mobile) or auto (desktop). */
  readonly actionButtonsFullWidth: boolean;
  /** Extra Sx applied to the cancel button (mobile adds py: 1.5). */
  readonly cancelButtonSx: Record<string, unknown> | undefined;
  /** Extra Sx applied to the save button (mobile adds py: 1.5). */
  readonly saveButtonSx: Record<string, unknown> | undefined;
  /** Button render order: desktop = cancel-first, mobile = save-first. */
  readonly actionOrder: "cancel-first" | "save-first";
}

export interface EditCategoryDialogSharedProps extends EditCategoryDialogProps {
  readonly slots: EditCategoryDialogSlotProps;
  /** Unique form id so submit buttons target the right <form>. */
  readonly formId: string;
  /** Title id for aria-labelledby. */
  readonly titleId: string;
}

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

function buildSubmitInput(data: EditCategoryFormValues): ClassCategoryUpdateInput {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    isActive: data.isActive ?? null,
    sortOrder: null,
  };
}

function cancelSx(theme: Theme): Record<string, unknown> {
  return {
    color: theme.palette.text.secondary,
    fontWeight: 700,
    borderRadius: 1.5,
  };
}

function saveSx(theme: Theme): Record<string, unknown> {
  return {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.onPrimary,
    fontWeight: 700,
    borderRadius: 1.5,
    "&:hover": { backgroundColor: theme.palette.primary.dark },
  };
}

function CancelActionButton({
  onClose,
  isLoading,
  labels,
  fullWidth,
  extraSx,
}: Readonly<{
  onClose: () => void;
  isLoading: boolean;
  labels: EditCategoryDialogProps["labels"];
  fullWidth: boolean;
  extraSx: Record<string, unknown> | undefined;
}>) {
  return (
    <Button
      onClick={onClose}
      disabled={isLoading}
      fullWidth={fullWidth}
      variant="text"
      sx={theme => ({
        ...cancelSx(theme),
        ...extraSx,
      })}
    >
      {labels.cancel}
    </Button>
  );
}

function SaveActionButton({
  formId,
  isLoading,
  labels,
  fullWidth,
  extraSx,
}: Readonly<{
  formId: string;
  isLoading: boolean;
  labels: EditCategoryDialogProps["labels"];
  fullWidth: boolean;
  extraSx: Record<string, unknown> | undefined;
}>) {
  return (
    <Button
      type="submit"
      form={formId}
      disabled={isLoading}
      fullWidth={fullWidth}
      variant="contained"
      sx={theme => ({
        ...saveSx(theme),
        ...extraSx,
      })}
    >
      {isLoading ? labels.saving : labels.saveChanges}
    </Button>
  );
}

export function EditCategoryDialogShared({
  open,
  onClose,
  onSubmit,
  category,
  isLoading,
  form,
  labels,
  slots,
  formId,
  titleId,
}: Readonly<EditCategoryDialogSharedProps>) {
  const { control, errors, handleSubmit } = form;

  const handleFormSubmit = (data: EditCategoryFormValues) => {
    if (!category?.id) return;
    onSubmit(category.id, buildSubmitInput(data));
  };

  if (!category) return null;

  const cancelBtn = (
    <CancelActionButton
      onClose={onClose}
      isLoading={isLoading}
      labels={labels}
      fullWidth={slots.actionButtonsFullWidth}
      extraSx={slots.cancelButtonSx}
    />
  );
  const saveBtn = (
    <SaveActionButton
      formId={formId}
      isLoading={isLoading}
      labels={labels}
      fullWidth={slots.actionButtonsFullWidth}
      extraSx={slots.saveButtonSx}
    />
  );

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} {...slots.dialogProps}>
      <DialogTitle id={titleId}>{labels.editCategory}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id={formId}
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <CategoryFormFields control={control} errors={errors} labels={labels} disabled={isLoading} />
        </Box>
      </DialogContent>
      <DialogActions sx={slots.actionsSx}>
        {slots.actionOrder === "cancel-first" ? (
          <>
            {cancelBtn}
            {saveBtn}
          </>
        ) : (
          <>
            {saveBtn}
            {cancelBtn}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
