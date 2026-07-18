"use client";

import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import type { ClassCategoryCreateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  ActiveToggleField,
  EntityFormDialogActions,
  LabeledTextField,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__";
import type { CategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { CreateCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "create-category-form-mobile";

/**
 * CreateCategoryDialogMobile — full-screen create-category dialog.
 *
 * NEW FOR PLAN v5: form state lifted to ViewModel. Pure prop passdown here.
 */
export function CreateCategoryDialogMobile({
  open,
  onClose,
  onSubmit,
  isLoading,
  form,
  labels,
}: Readonly<CreateCategoryDialogProps>) {
  const { control, errors, handleSubmit } = form;

  const handleFormSubmit = (data: CategoryFormValues) => {
    const input: ClassCategoryCreateInput = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
    };
    onSubmit(input);
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      aria-labelledby="create-category-dialog-title-mobile"
    >
      <DialogTitle id="create-category-dialog-title-mobile">{labels.createCategory}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id={FORM_ID}
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
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
          <ActiveToggleField name="isActive" control={control} label={labels.activeLabel} disabled={isLoading} />
        </Box>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={labels.cancel}
        saveLabel={labels.createCategory}
        onClose={onClose}
        isLoading={isLoading}
      />
    </Dialog>
  );
}
