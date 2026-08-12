"use client";

import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField/AvatarImageField";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import type { DialogActionSlotProps } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogActionButtonsShared";
import { DialogCommonTextFields } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogCommonTextFieldsShared";
import { DialogShellShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogShellShared";
import {
  ActiveToggleField,
  CategorySelectField,
  LabeledTextField,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/index";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";
import type {
  CategoryItem,
  SubjectFormStateProps,
  SubjectsDialogLabels,
} from "@/frontend/common/views/dashboard/subjects/home/types";

export type SubjectFormDialogSlotProps = DialogActionSlotProps;

export interface SubjectFormDialogSharedProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: SubjectFormValues) => void;
  readonly categories: readonly CategoryItem[];
  readonly isLoading: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly form: SubjectFormStateProps;
  readonly labels: SubjectsDialogLabels;
  readonly formId: string;
  readonly titleId: string;
  readonly dialogTitle: string;
  readonly saveLabel: string;
  readonly slots: SubjectFormDialogSlotProps;
}

export function SubjectFormDialogShared({
  open,
  onClose,
  onSubmit,
  categories,
  isLoading,
  onUploadAvatar,
  form,
  labels,
  formId,
  titleId,
  dialogTitle,
  saveLabel,
  slots,
}: Readonly<SubjectFormDialogSharedProps>) {
  const { control, errors, handleSubmit } = form;

  return (
    <DialogShellShared
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      titleId={titleId}
      dialogTitle={dialogTitle}
      cancelLabel={labels.cancel}
      saveLabel={saveLabel}
      savingLabel={labels.saving}
      formId={formId}
      slots={slots}
      onSubmit={handleSubmit(onSubmit)}
    >
      <AvatarImageField
        control={control}
        name="avatarUrl"
        label={labels.avatarLabel}
        onUploadAvatar={onUploadAvatar}
        disabled={isLoading}
      />
      <DialogCommonTextFields
        control={control}
        errors={errors}
        labels={labels}
        isLoading={isLoading}
        paths={{ name: "name", slug: "slug", description: "description" }}
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
      <ActiveToggleField name="isActive" control={control} label={labels.activeLabel} disabled={isLoading} />
      <LabeledTextField name="hourlyRate" control={control} label={labels.hourlyRateLabel} disabled={isLoading} />
      <CurrencyControllerField control={control} name="rateCurrency" label={labels.currencyLabel} />
    </DialogShellShared>
  );
}
