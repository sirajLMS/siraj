"use client";

import type { ClassSubjectCreateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SubjectFormDialogShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormDialogShared";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type { CreateSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "create-subject-form-desktop";
const TITLE_ID = "create-subject-dialog-title-desktop";

const CURRENCY_CODES = new Set(Object.values(CurrencyCode) as readonly string[]);

function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODES.has(value);
}

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
      rateCurrency: data.rateCurrency && isCurrencyCode(data.rateCurrency) ? data.rateCurrency : null,
    };
    onSubmit(input);
  };

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
      dialogTitle={labels.createSubject}
      saveLabel={labels.createSubject}
    />
  );
}
