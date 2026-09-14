"use client";

import {
  PackagePlanAutocomplete,
  type PackagePlanAutocompleteProps,
} from "@/frontend/common/views/dashboard/accounting/components/PackagePlanAutocomplete";

export type PackagePlanSelectSharedProps = PackagePlanAutocompleteProps;

/**
 * Legacy facade for the package-plan picker. Delegates to
 * PackagePlanAutocomplete under the historical name so existing payment-form
 * callers keep their import path and props contract unchanged.
 */
export function PackagePlanSelectShared(props: Readonly<PackagePlanSelectSharedProps>) {
  return <PackagePlanAutocomplete {...props} />;
}
