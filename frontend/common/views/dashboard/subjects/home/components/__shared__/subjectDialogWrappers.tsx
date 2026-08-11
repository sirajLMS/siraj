"use client";

import type {
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  makeDesktopSubjectSlots,
  makeMobileSubjectSlots,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectDialogSlots";
import {
  SubjectFormDialogShared,
  type SubjectFormDialogSlotProps,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormDialogShared";
import {
  subjectFormValuesToCreateInput,
  subjectFormValuesToUpdateInput,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormTransformers";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type {
  CreateSubjectDialogProps,
  EditSubjectDialogProps,
} from "@/frontend/common/views/dashboard/subjects/home/types";

type SlotFactory = (titleId: string) => SubjectFormDialogSlotProps;

export interface SubjectDialogTierConfig {
  readonly slotFactory: SlotFactory;
  readonly formId: string;
  readonly titleId: string;
}

function makeHandleSubmit(onSubmit: (input: ClassSubjectCreateInput) => void): (data: SubjectFormValues) => void {
  return data => onSubmit(subjectFormValuesToCreateInput(data));
}

function makeEditHandleSubmit(
  subjectId: string,
  onSubmit: (id: string, input: ClassSubjectUpdateInput) => void
): (data: SubjectFormValues) => void {
  return data => onSubmit(subjectId, subjectFormValuesToUpdateInput(data));
}

interface SubjectDialogRenderFields {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly categories: CreateSubjectDialogProps["categories"];
  readonly isLoading: boolean;
  readonly onUploadAvatar: CreateSubjectDialogProps["onUploadAvatar"];
  readonly form: CreateSubjectDialogProps["form"];
  readonly labels: CreateSubjectDialogProps["labels"];
}

function renderSubjectDialog(
  fields: SubjectDialogRenderFields,
  tier: SubjectDialogTierConfig,
  dialogTitle: string,
  saveLabel: string,
  handleFormSubmit: (data: SubjectFormValues) => void
) {
  return (
    <SubjectFormDialogShared
      open={fields.open}
      onClose={fields.onClose}
      onSubmit={handleFormSubmit}
      categories={fields.categories}
      isLoading={fields.isLoading}
      onUploadAvatar={fields.onUploadAvatar}
      form={fields.form}
      labels={fields.labels}
      formId={tier.formId}
      titleId={tier.titleId}
      dialogTitle={dialogTitle}
      saveLabel={saveLabel}
      slots={tier.slotFactory(tier.titleId)}
    />
  );
}

/** Factory that returns a create-subject dialog component for a given tier. */
export function makeCreateSubjectDialog(tier: SubjectDialogTierConfig) {
  return function CreateSubjectDialog({
    open,
    onClose,
    onSubmit,
    categories,
    isLoading,
    onUploadAvatar,
    form,
    labels,
  }: Readonly<CreateSubjectDialogProps>) {
    const handleFormSubmit = makeHandleSubmit(onSubmit);
    return renderSubjectDialog(
      { open, onClose, categories, isLoading, onUploadAvatar, form, labels },
      tier,
      labels.createSubject,
      labels.createSubject,
      handleFormSubmit
    );
  };
}

/** Factory that returns an edit-subject dialog component for a given tier. */
export function makeEditSubjectDialog(tier: SubjectDialogTierConfig) {
  return function EditSubjectDialog({
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
    if (!subject) return null;
    const subjectId = subject.id ?? "";
    if (!subjectId) return null;

    const handleFormSubmit = makeEditHandleSubmit(subjectId, onSubmit);

    return renderSubjectDialog(
      { open, onClose, categories, isLoading, onUploadAvatar, form, labels },
      tier,
      labels.editSubject,
      labels.saveChanges,
      handleFormSubmit
    );
  };
}

export function makeDesktopSubjectTier(): SubjectDialogTierConfig {
  return {
    slotFactory: makeDesktopSubjectSlots,
    formId: "create-subject-form-desktop",
    titleId: "create-subject-dialog-title-desktop",
  };
}

export function makeMobileSubjectTier(): SubjectDialogTierConfig {
  return {
    slotFactory: makeMobileSubjectSlots,
    formId: "create-subject-form-mobile",
    titleId: "create-subject-dialog-title-mobile",
  };
}
