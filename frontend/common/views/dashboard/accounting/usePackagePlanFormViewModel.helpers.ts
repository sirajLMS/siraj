import {
  type CreatePackagePlanMutationVariables,
  CurrencyCode,
  type PackagePlanQuery_packagePlan,
  type UpdatePackagePlanMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { asCurrencyCode } from "@/frontend/common/views/dashboard/accounting/__shared__";
import type {
  PackagePlanFormData,
  PackagePlanFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";

export const SUCCESS_AUTO_DISMISS_MS = 3000;
export const PACKAGES_PATH = "/accounting/packages";

export const CREATE_DEFAULT_VALUES: PackagePlanFormInput = {
  codename: "",
  displayName: "",
  description: null,
  creditHours: 10,
  priceAmount: 0,
  currency: CurrencyCode.Egp,
  active: true,
  sortOrder: 0,
  validityMonths: null,
};

/** Maps a loaded plan row onto the edit-form field values. */
export function buildExistingFormValues(existing: PackagePlanQuery_packagePlan): PackagePlanFormInput {
  const editCurrencyFallback = CurrencyCode.Egp;
  const editCurrencyMapped = asCurrencyCode(existing.currency ?? null);

  return {
    codename: existing.codename ?? "",
    displayName: existing.displayName ?? "",
    description: existing.description ?? null,
    creditHours: Number(existing.creditHours ?? 1),
    priceAmount: Number(existing.priceAmount ?? 0),
    currency: editCurrencyMapped ?? editCurrencyFallback,
    active: existing.active ?? true,
    sortOrder: existing.sortOrder ?? 0,
    validityMonths: existing.validityMonths ?? null,
  };
}

/** Builds the create-mutation payload from validated form data. */
export function buildCreatePlanInput(data: PackagePlanFormData): CreatePackagePlanMutationVariables["input"] {
  return {
    codename: data.codename,
    displayName: data.displayName,
    description: data.description ?? null,
    creditHours: data.creditHours,
    priceAmount: data.priceAmount,
    currency: data.currency,
    active: data.active,
    sortOrder: data.sortOrder,
    validityMonths: data.validityMonths ?? null,
  };
}

/** Builds the update-mutation payload, carrying the optimistic-lock version. */
export function buildUpdatePlanInput(
  data: PackagePlanFormData,
  planId: string,
  version: number | null
): UpdatePackagePlanMutationVariables["input"] {
  return {
    id: planId,
    displayName: data.displayName,
    description: data.description ?? null,
    creditHours: data.creditHours,
    priceAmount: data.priceAmount,
    currency: data.currency,
    active: data.active,
    sortOrder: data.sortOrder,
    validityMonths: data.validityMonths ?? null,
    version,
  };
}
