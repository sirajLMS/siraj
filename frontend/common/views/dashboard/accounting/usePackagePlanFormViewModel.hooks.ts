"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { PackagePlansQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  packagePlanQueryDocument,
  packagePlansQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import type {
  createPackagePlanFormSchema,
  PackagePlanFormData,
  PackagePlanFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import {
  buildExistingFormValues,
  CREATE_DEFAULT_VALUES,
  SUCCESS_AUTO_DISMISS_MS,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.helpers";
import type {
  ExistingPackagePlan,
  PackagePlanForm,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.types";

type PackagePlanFormSchema = ReturnType<typeof createPackagePlanFormSchema>;

interface UseExistingPackagePlanFormArgs {
  readonly planId: string;
  readonly isEditing: boolean;
  readonly schema: PackagePlanFormSchema;
}

interface UseExistingPackagePlanFormResult {
  readonly form: PackagePlanForm;
  readonly existing: ExistingPackagePlan | undefined;
  readonly loadingExisting: boolean;
  readonly catalogData: PackagePlansQuery | undefined;
}

/**
 * Loads the edited plan (when editing) plus the full catalog for client-side
 * codename uniqueness, and owns the react-hook-form instance. The edit form is
 * reseeded whenever the loaded plan changes.
 */
export function useExistingPackagePlanForm({
  planId,
  isEditing,
  schema,
}: Readonly<UseExistingPackagePlanFormArgs>): UseExistingPackagePlanFormResult {
  const { data: existingData, loading: loadingExisting } = useQuery(packagePlanQueryDocument, {
    variables: { id: planId },
    skip: !isEditing,
  });

  const existing = existingData?.packagePlan;

  // Full catalog load for client-side codename uniqueness (optimistic check;
  // the partial unique index remains the hard guarantee on the server).
  const { data: catalogData } = useQuery(packagePlansQueryDocument, {
    variables: { activeOnly: null, paginationArgs: null },
  });

  const form = useForm<PackagePlanFormInput, undefined, PackagePlanFormData>({
    resolver: zodResolver(schema),
    defaultValues: CREATE_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isEditing && existing) {
      form.reset(buildExistingFormValues(existing));
    }
  }, [isEditing, existing, form]);

  return { form, existing, loadingExisting, catalogData };
}

/** Auto-dismisses the success feedback after a short delay. */
export function useSuccessAutoDismiss(showSuccess: boolean, setShowSuccess: (value: boolean) => void): void {
  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }
    const timer = setTimeout(() => setShowSuccess(false), SUCCESS_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [showSuccess, setShowSuccess]);
}
