"use client";

import { CategoryCoreFields } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryCoreFieldsShared";
import type { DialogActionSlotProps } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogActionButtonsShared";
import { DialogShellShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/dialogShellShared";
import type { CategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { CreateCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

/** Slot props that each tier variant provides to customise the dialog shell. */
export type CreateCategoryDialogSlotProps = DialogActionSlotProps;

export interface CreateCategoryDialogSharedProps extends Omit<CreateCategoryDialogProps, "onSubmit"> {
  /** Submit handler receiving parsed form values. Tier wrappers transform to ClassCategoryCreateInput. */
  readonly onSubmit: (data: CategoryFormValues) => void;
  readonly slots: CreateCategoryDialogSlotProps;
  /** Unique form id so submit buttons target the right <form>. */
  readonly formId: string;
  /** Title id for aria-labelledby. */
  readonly titleId: string;
}

export function CreateCategoryDialogShared({
  open,
  onClose,
  onSubmit,
  isLoading,
  form,
  labels,
  slots,
  formId,
  titleId,
}: Readonly<CreateCategoryDialogSharedProps>) {
  const { control, errors, handleSubmit } = form;

  return (
    <DialogShellShared
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      titleId={titleId}
      dialogTitle={labels.createCategory}
      cancelLabel={labels.cancel}
      saveLabel={labels.createCategory}
      savingLabel={labels.saving}
      formId={formId}
      slots={slots}
      onSubmit={handleSubmit(onSubmit)}
    >
      <CategoryCoreFields control={control} errors={errors} labels={labels} disabled={isLoading} />
    </DialogShellShared>
  );
}
