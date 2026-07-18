"use client";

import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import type { ClassSubjectUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  ActiveToggleField,
  CategorySelectField,
  EntityFormDialogActions,
  LabeledTextField,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type { EditSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "edit-subject-form-mobile";

/**
 * EditSubjectDialogMobile — full-screen edit-subject dialog.
 *
 * NEW FOR PLAN v5: form state lifted to ViewModel. Pure prop passdown here.
 */
export function EditSubjectDialogMobile({
  open,
  onClose,
  onSubmit,
  subject,
  categories,
  isLoading,
  form,
  labels,
}: Readonly<EditSubjectDialogProps>) {
  const { control, errors, handleSubmit } = form;

  const handleFormSubmit = (data: SubjectFormValues) => {
    if (!subject?.id) return;
    const input: ClassSubjectUpdateInput = {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
      avatarUrl: null,
    };
    onSubmit(subject.id, input);
  };

  if (!subject) return null;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      aria-labelledby="edit-subject-dialog-title-mobile"
    >
      <DialogTitle id="edit-subject-dialog-title-mobile">{labels.editSubject}</DialogTitle>
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
          <CategorySelectField
            name="categoryId"
            control={control}
            label={labels.categoryLabel}
            placeholder={labels.selectCategory}
            error={errors.categoryId ? labels.categoryRequired : undefined}
            disabled={isLoading}
            categories={categories}
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
        saveLabel={labels.saveChanges}
        onClose={onClose}
        isLoading={isLoading}
      />
    </Dialog>
  );
}
