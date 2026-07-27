"use client";

import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField/AvatarImageField";
import type { ClassSubjectCreateInput, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import {
  ActiveToggleField,
  CategorySelectField,
  EntityFormDialogActions,
  LabeledTextField,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type { CreateSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "create-subject-form-desktop";

/**
 * CreateSubjectDialogDesktop — `sm`-width centered create-subject dialog.
 *
 * NEW FOR PLAN v5: form state lifted to ViewModel. Pure prop passdown here.
 */
export function CreateSubjectDialogDesktop({
  open,
  onClose,
  onSubmit,
  categories,
  isLoading,
  onUploadAvatar,
  form,
  labels,
}: Readonly<CreateSubjectDialogProps>) {
  const { control, errors, handleSubmit } = form;

  const handleFormSubmit = (data: SubjectFormValues) => {
    const input: ClassSubjectCreateInput = {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
      avatarUrl: data.avatarUrl || null,
      hourlyRate: data.hourlyRate || null,
      rateCurrency: data.rateCurrency ? (data.rateCurrency as CurrencyCode) : null,
    };
    onSubmit(input);
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-subject-dialog-title-desktop"
    >
      <DialogTitle id="create-subject-dialog-title-desktop">{labels.createSubject}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          component="form"
          id={FORM_ID}
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <AvatarImageField
            control={control}
            name="avatarUrl"
            label={labels.avatarLabel}
            onUploadAvatar={onUploadAvatar}
            disabled={isLoading}
          />
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
          <LabeledTextField name="hourlyRate" control={control} label={labels.hourlyRateLabel} disabled={isLoading} />
          <CurrencyControllerField control={control} name="rateCurrency" label={labels.currencyLabel} />
        </Box>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={labels.cancel}
        saveLabel={labels.createSubject}
        onClose={onClose}
        isLoading={isLoading}
      />
    </Dialog>
  );
}
