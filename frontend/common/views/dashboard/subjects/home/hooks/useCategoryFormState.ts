// NEW FOR PLAN v5: Form-state hook for the category create/edit dialogs.
// Per specs.md §6.2 the ViewModel is the SOLE owner of `useForm`/`useWatch`/
// `useEffect` form state. This hook is called by `useSubjectsViewModel`
// (in `frontend/common/`),
// which passes the resulting `{ control, errors, handleSubmit, values, reset }`
// down to the tier dialog files as plain props — the tier files no longer
// call `useForm`/`useWatch`/`useEffect`/`zodResolver`/inline `z.object`.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { slugify } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormShared";
import {
  type CategoryFormValues,
  categoryFormSchema,
  emptyCategoryFormValues,
} from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";

export interface UseCategoryFormStateOptions {
  readonly open: boolean;
  readonly category?: {
    readonly id?: string | null;
    readonly name?: string | null;
    readonly slug?: string | null;
    readonly description?: string | null;
    readonly isActive?: boolean | null;
  } | null;
}

export interface CategoryFormState {
  readonly control: ReturnType<typeof useForm<CategoryFormValues>>["control"];
  readonly errors: ReturnType<typeof useForm<CategoryFormValues>>["formState"]["errors"];
  readonly handleSubmit: ReturnType<typeof useForm<CategoryFormValues>>["handleSubmit"];
  readonly values: CategoryFormValues;
  readonly reset: ReturnType<typeof useForm<CategoryFormValues>>["reset"];
  readonly form: ReturnType<typeof useForm<CategoryFormValues>>;
}

/**
 * Owns the `useForm` instance + `useWatch` + `useEffect` value-sync logic for
 * the category create/edit dialogs. Create and edit share the same hook,
 * parameterized by `category` (null for create dialogs). MUST be called from
 * a ViewModel, never from a tier file (specs.md §2 + §6.2 + N26).
 */
export function useCategoryFormState(options: Readonly<UseCategoryFormStateOptions>): CategoryFormState {
  const { open, category } = options;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: emptyCategoryFormValues,
  });
  const { control, reset, setValue } = form;
  const errors = form.formState.errors;
  const handleSubmit = form.handleSubmit;

  const nameValue = useWatch({ control, name: "name" });
  const watchedValues = useWatch({ control });
  const values: CategoryFormValues = Object.assign({}, emptyCategoryFormValues, watchedValues);

  useEffect(() => {
    if (open && category) {
      reset({
        name: category.name ?? "",
        slug: category.slug ?? "",
        description: category.description ?? "",
        isActive: category.isActive ?? true,
      });
    } else if (open && !category) {
      reset(emptyCategoryFormValues);
    }
  }, [open, category, reset]);

  useEffect(() => {
    if (nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, setValue]);

  return { control, errors, handleSubmit, values, reset, form };
}
