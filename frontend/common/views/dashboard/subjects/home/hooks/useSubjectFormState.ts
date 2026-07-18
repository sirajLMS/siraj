// NEW FOR PLAN v5: Form-state hook for the subject create/edit dialogs.
// Per specs.md §6.2 the ViewModel is the SOLE owner of `useForm`/`useWatch`/
// `useEffect` form state. This hook is called by `useSubjectsViewModel`
// (in `frontend/common/`),
// which passes the resulting `{ control, errors, handleSubmit, values, reset }`
// down to the tier dialog files as plain props — the tier files no longer
// call `useForm`/`useWatch`/`useEffect`/`zodResolver`.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { slugify } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormShared";
import {
  emptySubjectFormValues,
  type SubjectFormValues,
  subjectFormSchema,
} from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";

export interface UseSubjectFormStateOptions {
  readonly open: boolean;
  readonly subject?: {
    readonly id?: string | null;
    readonly name?: string | null;
    readonly slug?: string | null;
    readonly category?: { readonly id?: string | null } | null;
    readonly description?: string | null;
    readonly isActive?: boolean | null;
  } | null;
}

export interface SubjectFormState {
  readonly control: ReturnType<typeof useForm<SubjectFormValues>>["control"];
  readonly errors: ReturnType<typeof useForm<SubjectFormValues>>["formState"]["errors"];
  readonly handleSubmit: ReturnType<typeof useForm<SubjectFormValues>>["handleSubmit"];
  readonly values: SubjectFormValues;
  readonly reset: ReturnType<typeof useForm<SubjectFormValues>>["reset"];
  readonly form: ReturnType<typeof useForm<SubjectFormValues>>;
}

/**
 * Owns the `useForm` instance + `useWatch` + `useEffect` value-sync logic for
 * the subject create/edit dialogs. MUST be called from a ViewModel, never
 * from a tier file (specs.md §2 + §6.2 + N26).
 */
export function useSubjectFormState(options: Readonly<UseSubjectFormStateOptions>): SubjectFormState {
  const { open, subject } = options;

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: emptySubjectFormValues,
  });
  const { control, reset, setValue } = form;
  const errors = form.formState.errors;
  const handleSubmit = form.handleSubmit;

  const nameValue = useWatch({ control, name: "name" });
  const values = form.watch() as SubjectFormValues;

  useEffect(() => {
    if (open && subject) {
      reset({
        name: subject.name ?? "",
        slug: subject.slug ?? "",
        categoryId: subject.category?.id ?? "",
        description: subject.description ?? "",
        isActive: subject.isActive ?? true,
      });
    } else if (open && !subject) {
      reset(emptySubjectFormValues);
    }
  }, [open, subject, reset]);

  useEffect(() => {
    if (nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, setValue]);

  return { control, errors, handleSubmit, values, reset, form };
}
