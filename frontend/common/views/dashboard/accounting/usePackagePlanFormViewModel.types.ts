import type { Control, FieldErrors, UseFormHandleSubmit, UseFormReturn } from "react-hook-form";
import type { PackagePlanQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PackagePlanFormData,
  PackagePlanFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

/** The react-hook-form instance type used by the package-plan form. */
export type PackagePlanForm = UseFormReturn<PackagePlanFormInput, undefined, PackagePlanFormData>;

/** A loaded package-plan row (nullable, as selected by `PackagePlanQuery`). */
export type ExistingPackagePlan = PackagePlanQuery["packagePlan"];

/** Flat view model returned by `usePackagePlanFormViewModel`. */
export interface UsePackagePlanFormViewModel {
  readonly t: PackagePlansLabels;
  readonly control: Control<PackagePlanFormInput, undefined, PackagePlanFormData>;
  readonly errors: FieldErrors<PackagePlanFormInput>;
  readonly handleSubmit: UseFormHandleSubmit<PackagePlanFormInput, PackagePlanFormData>;
  readonly isSubmitting: boolean;
  readonly isEditing: boolean;
  readonly loadingExisting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly existing: PackagePlanQuery["packagePlan"] | undefined;
  readonly onSubmit: (data: PackagePlanFormData) => Promise<void>;
  readonly onArchive: () => Promise<void>;
  readonly archiveDialogOpen: boolean;
  readonly setArchiveDialogOpen: (open: boolean) => void;
  readonly archiving: boolean;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

/** Props accepted by `usePackagePlanFormViewModel`. */
export interface UsePackagePlanFormViewModelProps {
  readonly planId?: string;
}
