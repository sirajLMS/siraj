"use client";

import type { Control, FieldErrors, FieldPath, FieldValues } from "react-hook-form";
import { LabeledTextField } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/index";

export interface DialogCommonTextFieldsLabels {
  readonly nameLabel: string;
  readonly nameRequired: string;
  readonly slugLabel: string;
  readonly slugRequired: string;
  readonly descriptionLabel: string;
}

export interface DialogCommonTextFieldPaths<T extends FieldValues> {
  readonly name: FieldPath<T>;
  readonly slug: FieldPath<T>;
  readonly description: FieldPath<T>;
}

export function DialogCommonTextFields<T extends FieldValues>({
  control,
  errors,
  labels,
  isLoading,
  paths,
}: Readonly<{
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: DialogCommonTextFieldsLabels;
  readonly isLoading: boolean;
  readonly paths: DialogCommonTextFieldPaths<T>;
}>) {
  return (
    <>
      <LabeledTextField<T>
        name={paths.name}
        control={control}
        label={labels.nameLabel}
        required
        error={errors[paths.name] ? labels.nameRequired : undefined}
        disabled={isLoading}
      />
      <LabeledTextField<T>
        name={paths.slug}
        control={control}
        label={labels.slugLabel}
        required
        error={errors[paths.slug] ? labels.slugRequired : undefined}
        disabled={isLoading}
      />
      <LabeledTextField<T>
        name={paths.description}
        control={control}
        label={labels.descriptionLabel}
        disabled={isLoading}
        multiline
        rows={3}
      />
    </>
  );
}
