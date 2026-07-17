"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActiveToggleField,
  CategorySelectField,
  EntityFormDialogActions,
  emptySubjectFormValues,
  LabeledTextField,
  type SubjectFormValues,
  slugify,
  subjectFormSchema,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__";
import type { EditSubjectDialogProps, SubjectItem } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale";

const FORM_ID = "edit-subject-form-mobile";

function useEditSubjectForm(open: boolean, subject: SubjectItem | null) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: emptySubjectFormValues,
  });

  useEffect(() => {
    if (open && subject) {
      reset({
        name: subject.name ?? "",
        slug: subject.slug ?? "",
        categoryId: subject.category?.id ?? "",
        description: subject.description ?? "",
        isActive: subject.isActive ?? true,
      });
    }
  }, [open, subject, reset]);

  const nameValue = useWatch({ control, name: "name" });

  useEffect(() => {
    if (nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, setValue]);

  return { control, errors, handleSubmit };
}

/**
 * EditSubjectDialogMobile — full-screen edit-subject dialog.
 */
export function EditSubjectDialogMobile({
  open,
  onClose,
  onSubmit,
  subject,
  categories,
  isLoading,
}: Readonly<EditSubjectDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;
  const { control, errors, handleSubmit } = useEditSubjectForm(open, subject);

  const handleFormSubmit = (data: SubjectFormValues) => {
    if (!subject?.id) return;
    onSubmit(subject.id, {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
      avatarUrl: null,
    });
  };

  if (!subject) return null;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      aria-labelledby="edit-subject-dialog-title-mobile"
    >
      <DialogTitle id="edit-subject-dialog-title-mobile">{t.editSubject}</DialogTitle>
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
          <CategorySelectField
            name="categoryId"
            control={control}
            label={t.categoryLabel}
            placeholder={t.selectCategory}
            error={errors.categoryId ? t.categoryRequired : undefined}
            disabled={isLoading}
            categories={categories}
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
        saveLabel={t.saveChanges}
        onClose={onClose}
        isLoading={isLoading}
      />
    </Dialog>
  );
}
