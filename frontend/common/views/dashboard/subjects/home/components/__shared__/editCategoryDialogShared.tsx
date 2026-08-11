"use client";

import { Box, Switch, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import type { ClassCategoryUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { DialogActionSlotProps } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogActionButtonsShared";
import { DialogShellShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogShellShared";
import { LabeledTextField } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/index";
import type { EditCategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { EditCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

/** Slot props that each tier variant provides to customize the dialog shell. */
export type EditCategoryDialogSlotProps = DialogActionSlotProps;

export interface EditCategoryDialogSharedProps extends EditCategoryDialogProps {
  readonly slots: EditCategoryDialogSlotProps;
  readonly formId: string;
  readonly titleId: string;
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

  return (
    <DialogShellShared
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      titleId={titleId}
      dialogTitle={labels.editCategory}
      cancelLabel={labels.cancel}
      saveLabel={labels.saveChanges}
      savingLabel={labels.saving}
      formId={formId}
      slots={slots}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <LabeledTextField
        name="name"
        control={control}
        label={labels.nameLabel}
        required
        error={errors.name ? labels.nameRequired : undefined}
        disabled={isLoading}
      />
      <LabeledTextField
        name="slug"
        control={control}
        label={labels.slugLabel}
        required
        error={errors.slug ? labels.slugRequired : undefined}
        disabled={isLoading}
      />
      <LabeledTextField
        name="description"
        control={control}
        label={labels.descriptionLabel}
        disabled={isLoading}
        multiline
        rows={3}
      />
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Switch checked={field.value ?? true} onChange={field.onChange} disabled={isLoading} />
            <Typography variant="bodyMd">{labels.activeLabel}</Typography>
          </Box>
        )}
      />
    </DialogShellShared>
  );
}
