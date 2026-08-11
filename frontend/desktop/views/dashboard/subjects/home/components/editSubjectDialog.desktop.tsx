"use client";

import type { ClassSubjectUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SubjectFormDialogShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormDialogShared";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type { EditSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "edit-subject-form-desktop";
const TITLE_ID = "edit-subject-dialog-title-desktop";

const VALID_CURRENCY_CODES = new Set(Object.values(CurrencyCode) as readonly string[]);

function isCurrencyCode(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

/**
 * EditSubjectDialogDesktop — `sm`-width centered edit-subject dialog.
 *
 * NEW FOR PLAN v5: form state lifted to ViewModel. Pure prop passdown here.
 */
export function EditSubjectDialogDesktop({
  open,
  onClose,
  onSubmit,
  subject,
  categories,
  isLoading,
  onUploadAvatar,
  form,
  labels,
}: Readonly<EditSubjectDialogProps>) {
  const handleFormSubmit = (data: SubjectFormValues) => {
    if (!subject?.id) return;
    const input: ClassSubjectUpdateInput = {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      isActive: data.isActive ?? null,
      sortOrder: null,
      avatarUrl: data.avatarUrl || null,
      hourlyRate: data.hourlyRate || null,
      rateCurrency: data.rateCurrency && isCurrencyCode(data.rateCurrency) ? data.rateCurrency : null,
    };
    onSubmit(subject.id, input);
  };

  if (!subject) return null;

  return (
    <SubjectFormDialogShared
      open={open}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      categories={categories}
      isLoading={isLoading}
      onUploadAvatar={onUploadAvatar}
      form={form}
      labels={labels}
      formId={FORM_ID}
      titleId={TITLE_ID}
      dialogTitle={labels.editSubject}
      saveLabel={labels.saveChanges}
    />
  );
}
