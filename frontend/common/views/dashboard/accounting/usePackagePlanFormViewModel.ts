"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Control, type FieldErrors, type UseFormHandleSubmit, useForm } from "react-hook-form";
import { CurrencyCode, type PackagePlanQuery } from "@/frontend/common/graphql/generated/gql/graphql";

const VALID_CURRENCY_CODES = new Set<string>(Object.values(CurrencyCode));

function isCurrencyCodeValue(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

/** Resolves a raw wire string to its matching CurrencyCode member (undefined when unknown). */
function asCurrencyCode(value: string | null): CurrencyCode | undefined {
  return value !== null && isCurrencyCodeValue(value) ? value : undefined;
}

import {
  archivePackagePlanMutationDocument,
  createPackagePlanMutationDocument,
  packagePlanQueryDocument,
  packagePlansQueryDocument,
  updatePackagePlanMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { logger } from "@/frontend/common/utils/logger";
import {
  createPackagePlanFormSchema,
  type PackagePlanFormData,
  type PackagePlanFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPackagePlans } from "@/shared/locale/namespaces";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

const SUCCESS_AUTO_DISMISS_MS = 3000;
const PACKAGES_PATH = "/accounting/packages";

const CREATE_DEFAULT_VALUES: PackagePlanFormInput = {
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

export interface UsePackagePlanFormViewModelProps {
  readonly planId?: string;
}

export function usePackagePlanFormViewModel({
  planId,
}: Readonly<UsePackagePlanFormViewModelProps> = {}): UsePackagePlanFormViewModel {
  const t = useAppTranslation(DashboardAccountingPackagePlans);
  const router = useRouter();
  const isEditing = Boolean(planId);

  const schema = useMemo(() => createPackagePlanFormSchema(t), [t]);

  const { data: existingData, loading: loadingExisting } = useQuery(packagePlanQueryDocument, {
    variables: { id: planId ?? "" },
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
      const editCurrencyFallback = CurrencyCode.Egp;
      const editCurrencyRaw = existing.currency ?? null;
      const editCurrencyMapped = asCurrencyCode(editCurrencyRaw);

      form.reset({
        codename: existing.codename ?? "",
        displayName: existing.displayName ?? "",
        description: existing.description ?? null,
        creditHours: Number(existing.creditHours ?? 1),
        priceAmount: Number(existing.priceAmount ?? 0),
        currency: editCurrencyMapped ?? editCurrencyFallback,
        active: existing.active ?? true,
        sortOrder: existing.sortOrder ?? 0,
        validityMonths: existing.validityMonths ?? null,
      });
    }
  }, [isEditing, existing, form]);

  const [createPlanMutation, { loading: creating }] = useMutation(createPackagePlanMutationDocument);
  const [updatePlanMutation, { loading: updating }] = useMutation(updatePackagePlanMutationDocument);
  const [archivePlanMutation, { loading: archiving }] = useMutation(archivePackagePlanMutationDocument);

  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }
    const timer = setTimeout(() => setShowSuccess(false), SUCCESS_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const navigateBack = useCallback(() => {
    router.push(PACKAGES_PATH);
  }, [router]);

  const checkCodenameUniqueness = useCallback(
    (codename: string): string | null => {
      const plans = catalogData?.packagePlans ?? [];
      const targetCodename = codename.trim().toLowerCase();
      const clash = plans.find(
        plan => (plan.codename ?? "").toLowerCase() === targetCodename && (!planId || plan.id !== planId)
      );
      return clash ? t.saveError : null;
    },
    [catalogData, planId, t.saveError]
  );

  const onSubmit = useCallback(
    async (data: PackagePlanFormData) => {
      setSubmitError(null);

      const uniquenessError = checkCodenameUniqueness(data.codename);
      if (uniquenessError && !isEditing) {
        form.setError("codename", { message: uniquenessError });
        return;
      }

      try {
        if (isEditing && planId) {
          await updatePlanMutation({
            variables: {
              input: {
                id: planId,
                displayName: data.displayName,
                description: data.description ?? null,
                creditHours: data.creditHours,
                priceAmount: data.priceAmount,
                currency: data.currency,
                active: data.active,
                sortOrder: data.sortOrder,
                validityMonths: data.validityMonths ?? null,
                // Optimistic lock: version from the loaded plan.
                version: existing?.version ?? null,
              },
            },
          });
        } else {
          await createPlanMutation({
            variables: {
              input: {
                codename: data.codename,
                displayName: data.displayName,
                description: data.description ?? null,
                creditHours: data.creditHours,
                priceAmount: data.priceAmount,
                currency: data.currency,
                active: data.active,
                sortOrder: data.sortOrder,
                validityMonths: data.validityMonths ?? null,
              },
            },
          });
        }
        setShowSuccess(true);
        setTimeout(navigateBack, 600);
      } catch (error) {
        logger.error("packagePlan save failed", { error });
        setSubmitError(error instanceof Error ? error.message : t.saveError);
      }
    },
    [
      checkCodenameUniqueness,
      isEditing,
      planId,
      form,
      updatePlanMutation,
      createPlanMutation,
      existing,
      navigateBack,
      t.saveError,
    ]
  );

  const onArchive = useCallback(async () => {
    if (!planId) return;
    setSubmitError(null);
    try {
      await archivePlanMutation({ variables: { id: planId } });
      setArchiveDialogOpen(false);
      setShowSuccess(true);
      setTimeout(navigateBack, 600);
    } catch (error) {
      logger.error("packagePlan archive failed", { error });
      setArchiveDialogOpen(false);
      setSubmitError(error instanceof Error ? error.message : t.saveError);
    }
  }, [planId, archivePlanMutation, navigateBack, t.saveError]);

  const onDismissSuccess = useCallback(() => setShowSuccess(false), []);
  const onDismissError = useCallback(() => setSubmitError(null), []);

  return {
    t,
    control: form.control,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    isSubmitting: creating || updating,
    isEditing,
    loadingExisting,
    showSuccess,
    submitError,
    existing,
    onSubmit,
    onArchive,
    archiveDialogOpen,
    setArchiveDialogOpen,
    archiving,
    onDismissSuccess,
    onDismissError,
  };
}
