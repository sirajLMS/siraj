"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActiveToggleField,
  type CategoryFormValues,
  categoryFormSchema,
  EntityFormDialogActions,
  emptyCategoryFormValues,
  LabeledTextField,
  slugify,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__";
import type { CreateCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale";

const FORM_ID = "create-category-form";

export function CreateCategoryDialog({ open, onClose, onSubmit, isLoading }: Readonly<CreateCategoryDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: emptyCategoryFormValues,
  });

  const nameValue = useWatch({ control, name: "name" });

  useEffect(() => {
    if (open) {
      reset(emptyCategoryFormValues);
    }
  }, [open, reset]);

  useEffect(() => {
    setValue("slug", slugify(nameValue));
  }, [nameValue, setValue]);

  const handleFormSubmit = (data: CategoryFormValues) => {
    onSubmit({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-category-dialog-title"
    >
      <DialogTitle id="create-category-dialog-title">{t.createCategory}</DialogTitle>
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
            label={t.nameLabel}
            required
            error={errors.name ? t.nameRequired : undefined}
            disabled={isLoading}
          />
          <LabeledTextField
            name="slug"
            control={control}
            label={t.slugLabel}
            required
            error={errors.slug ? t.slugRequired : undefined}
            disabled={isLoading}
          />
          <LabeledTextField
            name="description"
            control={control}
            label={t.descriptionLabel}
            disabled={isLoading}
            multiline
            rows={3}
          />
          <ActiveToggleField name="isActive" control={control} label={t.activeLabel} disabled={isLoading} />
        </Box>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={t.cancel}
        saveLabel={t.createCategory}
        onClose={onClose}
        isLoading={isLoading}
      />
    </Dialog>
  );
}
