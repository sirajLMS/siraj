"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import type { PackagePlansQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  archivePackagePlanMutationDocument,
  createPackagePlanMutationDocument,
  updatePackagePlanMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { logger } from "@/frontend/common/utils/logger";
import type { PackagePlanFormData } from "@/frontend/common/views/dashboard/accounting/schemas/packagePlanFormSchema";
import {
  buildCreatePlanInput,
  buildUpdatePlanInput,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.helpers";
import type {
  ExistingPackagePlan,
  PackagePlanForm,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.types";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

interface UsePackagePlanSubmitArgs {
  readonly form: PackagePlanForm;
  readonly existing: ExistingPackagePlan | undefined;
  readonly catalogData: PackagePlansQuery | undefined;
  readonly planId: string;
  readonly isEditing: boolean;
  readonly t: PackagePlansLabels;
  readonly navigateBack: () => void;
  readonly setShowSuccess: (value: boolean) => void;
  readonly setSubmitError: (value: string | null) => void;
}

interface UsePackagePlanSubmitResult {
  readonly creating: boolean;
  readonly updating: boolean;
  readonly onSubmit: (data: PackagePlanFormData) => Promise<void>;
}

/** Owns the create/update mutations and the submit handler for the plan form. */
export function usePackagePlanSubmit({
  form,
  existing,
  catalogData,
  planId,
  isEditing,
  t,
  navigateBack,
  setShowSuccess,
  setSubmitError,
}: Readonly<UsePackagePlanSubmitArgs>): UsePackagePlanSubmitResult {
  const [createPlanMutation, { loading: creating }] = useMutation(createPackagePlanMutationDocument);
  const [updatePlanMutation, { loading: updating }] = useMutation(updatePackagePlanMutationDocument);

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
            variables: { input: buildUpdatePlanInput(data, planId, existing?.version ?? null) },
          });
        } else {
          await createPlanMutation({ variables: { input: buildCreatePlanInput(data) } });
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
      setShowSuccess,
      setSubmitError,
      t.saveError,
    ]
  );

  return { creating, updating, onSubmit };
}

interface UsePackagePlanArchiveArgs {
  readonly planId: string;
  readonly t: PackagePlansLabels;
  readonly navigateBack: () => void;
  readonly setShowSuccess: (value: boolean) => void;
  readonly setSubmitError: (value: string | null) => void;
}

interface UsePackagePlanArchiveResult {
  readonly archiving: boolean;
  readonly archiveDialogOpen: boolean;
  readonly setArchiveDialogOpen: (open: boolean) => void;
  readonly onArchive: () => Promise<void>;
}

/** Owns the archive mutation, confirmation-dialog state, and archive handler. */
export function usePackagePlanArchive({
  planId,
  t,
  navigateBack,
  setShowSuccess,
  setSubmitError,
}: Readonly<UsePackagePlanArchiveArgs>): UsePackagePlanArchiveResult {
  const [archivePlanMutation, { loading: archiving }] = useMutation(archivePackagePlanMutationDocument);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

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
  }, [planId, archivePlanMutation, navigateBack, setShowSuccess, setSubmitError, t.saveError]);

  return { archiving, archiveDialogOpen, setArchiveDialogOpen, onArchive };
}
