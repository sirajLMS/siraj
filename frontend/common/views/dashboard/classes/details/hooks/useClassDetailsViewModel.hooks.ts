"use client";

import { useParams } from "next/navigation";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useClassActionHandlers } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassActionHandlers";
import { useClassDetailsContainerState } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsContainerState";
import { useClassDetailsPermissions } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsPermissions";
import { useClassDetailsData } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsQuery";
import {
  buildClassDetailsHeaderLabels,
  buildOverrideRateDialog,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel.helpers";
import { useClassMutations } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassMutations";
import { useEventLogDownload } from "@/frontend/common/views/dashboard/classes/details/hooks/useEventLogDownload";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

function useClassDetailsTranslations() {
  const t = useAppTranslation(Translation.Dashboard.ClassDetails);
  const session = useAppTranslation(Translation.Session);
  return { t, headerLabels: buildClassDetailsHeaderLabels(t, session.classTypes) };
}

function useClassInstanceId(): string {
  const params = useParams();
  const rawId = params?.id;
  return typeof rawId === "string" ? rawId : "";
}

export function useClassDetailsViewModelCore() {
  const router = useRouter();
  const locale = useAppLocale();
  const { t, headerLabels } = useClassDetailsTranslations();
  const id = useClassInstanceId();
  const hasPermission = useUserStore(state => state.hasPermission);

  const {
    isWarningDismissed,
    setIsWarningDismissed,
    feedbackState,
    setFeedbackState,
    shouldLoadEvents,
    setShouldLoadEvents,
    deleteDialogOpen,
    setDeleteDialogOpen,
    overrideDialogOpen,
    setOverrideDialogOpen,
    overrideRateAmount,
    setOverrideRateAmount,
    overrideRateCurrency,
    setOverrideRateCurrency,
    openOverrideDialog,
  } = useClassDetailsContainerState();

  const { data, loading, error } = useClassDetailsData(id);
  useEventLogDownload(id, shouldLoadEvents, setShouldLoadEvents, setFeedbackState, t);

  const mutations = useClassMutations({
    id,
    onError: message => setFeedbackState({ message, severity: "error" }),
  });
  const handlers = useClassActionHandlers(id, mutations, router, setFeedbackState, t);
  const { canOverride, isParentView, isStudentView, canViewSessionDetails } = useClassDetailsPermissions(hasPermission);

  // Triggers the lazy class-status-events query inside useEventLogDownload; when
  // the events resolve, the hook serializes them into a JSON file download.
  const onGenerateLog = () => setShouldLoadEvents(true);

  const overrideRateDialog = buildOverrideRateDialog(
    {
      open: overrideDialogOpen,
      amount: overrideRateAmount,
      currency: overrideRateCurrency,
      setAmount: setOverrideRateAmount,
      setCurrency: setOverrideRateCurrency,
      setOpen: setOverrideDialogOpen,
      openDialog: openOverrideDialog,
    },
    handlers,
    data?.classInstance?.rateAmount ?? "",
    data?.classInstance?.rateCurrency ?? null
  );

  return {
    locale,
    id,
    t,
    headerLabels,
    data,
    loading,
    error,
    mutations,
    handlers,
    canOverride,
    isParentView,
    isStudentView,
    canViewSessionDetails,
    isWarningDismissed,
    setIsWarningDismissed,
    feedbackState,
    deleteDialogOpen,
    setDeleteDialogOpen,
    onGenerateLog,
    overrideRateDialog,
  };
}
