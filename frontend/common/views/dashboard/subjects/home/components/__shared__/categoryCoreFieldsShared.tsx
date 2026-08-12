"use client";

import type { Control, FieldErrors } from "react-hook-form";
import {
  ActiveToggleField,
  LabeledTextField,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/index";
import type { CategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";
import type { SubjectsDialogLabels } from "@/frontend/common/views/dashboard/subjects/home/types";

interface CategoryCoreFieldsProps {
  readonly control: Control<CategoryFormValues>;
  readonly errors: FieldErrors<CategoryFormValues>;
  readonly labels: SubjectsDialogLabels;
  readonly disabled: boolean;
}

/** Renders name, slug, description, and isActive fields shared by all category dialogs. */
export function CategoryCoreFields({ control, errors, labels, disabled }: Readonly<CategoryCoreFieldsProps>) {
  return (
    <>
      <LabeledTextField
        name="name"
        control={control}
        label={labels.nameLabel}
        required
        error={errors.name ? labels.nameRequired : undefined}
        disabled={disabled}
      />
      <LabeledTextField
        name="slug"
        control={control}
        label={labels.slugLabel}
        required
        error={errors.slug ? labels.slugRequired : undefined}
        disabled={disabled}
      />
      <LabeledTextField
        name="description"
        control={control}
        label={labels.descriptionLabel}
        disabled={disabled}
        multiline
        rows={3}
      />
      <ActiveToggleField name="isActive" control={control} label={labels.activeLabel} disabled={disabled} />
    </>
  );
}
