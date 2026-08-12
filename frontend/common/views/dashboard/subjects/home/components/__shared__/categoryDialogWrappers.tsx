"use client";

import {
  makeDesktopCreateCategorySlots,
  makeMobileCreateCategorySlots,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryDialogSlots";
import { categoryFormValuesToCreateInput } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryFormTransformers";
import {
  CreateCategoryDialogShared,
  type CreateCategoryDialogSlotProps,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/createCategoryDialogShared";
import type { CategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { CreateCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

type SlotFactory = (titleId: string) => CreateCategoryDialogSlotProps;

export interface CategoryDialogTierConfig {
  readonly slotFactory: SlotFactory;
  readonly formId: string;
  readonly titleId: string;
}

/** Factory that returns a create-category dialog component for a given tier. */
export function makeCreateCategoryDialog(tier: CategoryDialogTierConfig) {
  return function CreateCategoryDialog({
    open,
    onClose,
    onSubmit,
    isLoading,
    form,
    labels,
  }: Readonly<CreateCategoryDialogProps>) {
    const handleFormSubmit = (data: CategoryFormValues) => {
      onSubmit(categoryFormValuesToCreateInput(data));
    };

    return (
      <CreateCategoryDialogShared
        open={open}
        onClose={onClose}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        form={form}
        labels={labels}
        formId={tier.formId}
        titleId={tier.titleId}
        slots={tier.slotFactory(tier.titleId)}
      />
    );
  };
}

export function makeDesktopCategoryTier(): CategoryDialogTierConfig {
  return {
    slotFactory: makeDesktopCreateCategorySlots,
    formId: "create-category-form-desktop",
    titleId: "create-category-dialog-title-desktop",
  };
}

export function makeMobileCategoryTier(): CategoryDialogTierConfig {
  return {
    slotFactory: makeMobileCreateCategorySlots,
    formId: "create-category-form-mobile",
    titleId: "create-category-dialog-title-mobile",
  };
}
