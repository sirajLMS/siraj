"use client";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { useClassMutations } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassMutations";
import type { ActionFeedbackState, ClassActionHandlers } from "@/frontend/common/views/dashboard/classes/details/types";
import type { useRouter } from "@/shared/i18n/navigation";
import type { ClassDetailsLabels } from "@/shared/locale";

export function useClassActionHandlers(
  id: string,
  mutations: ReturnType<typeof useClassMutations>,
  router: ReturnType<typeof useRouter>,
  setFeedbackState: (state: ActionFeedbackState | null) => void,
  t: ClassDetailsLabels
): ClassActionHandlers {
  return {
    handleForceActivate: async () => {
      try {
        await mutations.forceActivate();
        setFeedbackState({ message: t.actionFeedback.forceActivateSuccess, severity: "success" });
      } catch {
        // Error feedback is handled by useClassMutations onError
      }
    },
    handleStop: async () => {
      try {
        await mutations.stopClass();
        setFeedbackState({ message: t.actionFeedback.stopSuccess, severity: "success" });
      } catch {
        // Error feedback is handled by useClassMutations onError
      }
    },
    handleActivate: async () => {
      try {
        await mutations.activate();
        setFeedbackState({ message: t.actionFeedback.activateSuccess, severity: "success" });
      } catch {
        // Error feedback is handled by useClassMutations onError
      }
    },
    handleDeleteConfirm: async () => {
      try {
        await mutations.deleteClass();
        router.push("/dashboard");
      } catch {
        setFeedbackState({ message: t.actionFeedback.deleteError, severity: "error" });
      }
    },
    handleReschedule: () => {
      router.push(`/schedule/tracking/reschedule?classInstanceId=${id}`);
    },
    handleInfoEdit: () => {
      router.push(`/classes/${id}/audit`);
    },
    handleOverrideRate: async (rateAmount: string | null, rateCurrency: CurrencyCode | null) => {
      try {
        await mutations.overrideRate(rateAmount, rateCurrency);
        setFeedbackState({
          message: rateAmount ? t.instanceDetails.overrideSuccess : t.instanceDetails.clearSuccess,
          severity: "success",
        });
      } catch {
        setFeedbackState({
          message: rateAmount ? t.instanceDetails.overrideError : t.instanceDetails.clearError,
          severity: "error",
        });
      }
    },
  };
}
