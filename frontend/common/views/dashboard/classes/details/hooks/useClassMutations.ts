"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  activateClassMutationDocument,
  activateOverrideClassMutationDocument,
  classInstanceQueryDocument,
  deleteClassInstanceMutationDocument,
  overrideClassInstanceRateMutationDocument,
  resetClassMutationDocument,
  stopClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildLifecycleHandlers,
  buildSessionHandlers,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassMutations.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

interface UseClassMutationsOptions {
  id: string;
  onError?: (error: string) => void;
}

interface UseClassMutationsReturn {
  forceActivate: () => Promise<void>;
  activate: () => Promise<void>;
  stopClass: () => Promise<void>;
  deleteClass: () => Promise<void>;
  startSession: () => Promise<void>;
  markAbsent: () => Promise<void>;
  processLeave: (reason: string) => Promise<void>;
  resetSession: () => Promise<void>;
  overrideRate: (rateAmount: string | null, rateCurrency: CurrencyCode | null) => Promise<void>;
  isStarting: boolean;
  isMarkingAbsent: boolean;
  isProcessingLeave: boolean;
  isResetting: boolean;
  isOverridingRate: boolean;
}

export function useClassMutations({ id, onError }: UseClassMutationsOptions): UseClassMutationsReturn {
  const t = useAppTranslation(Translation.Dashboard.ClassDetails);
  const client = useApolloClient();

  const reportMutationError = (context: string, err: unknown, fallbackMessage: string) => {
    logger.error(context, { err });
    onError?.(getGraphQLErrorMessage(err, fallbackMessage));
  };

  const refetchCompleted = () => {
    void client.refetchQueries({ include: [classInstanceQueryDocument] });
  };

  const [activateClass] = useMutation(activateClassMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Activate class failed:", err, t.actionFeedback.activateError),
  });

  const [activateOverrideClass] = useMutation(activateOverrideClassMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Activate override class failed:", err, t.actionFeedback.forceActivateError),
  });

  const [stopClassMutation] = useMutation(stopClassMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Stop class failed:", err, t.actionFeedback.stopError),
  });

  const [deleteClassMutation] = useMutation(deleteClassInstanceMutationDocument, {
    onError: err => reportMutationError("Delete class failed:", err, t.actionFeedback.deleteError),
  });

  const [startSessionMutation, { loading: isStarting }] = useMutation(updateSessionStatusStartMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Start session failed:", err, t.actionFeedback.startError),
  });

  const [markAbsentMutation, { loading: isMarkingAbsent }] = useMutation(updateSessionStatusAbsentMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Mark absent failed:", err, t.actionFeedback.markAbsentError),
  });

  const [processLeaveMutation, { loading: isProcessingLeave }] = useMutation(updateSessionStatusLeaveMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Process leave failed:", err, t.actionFeedback.leaveError),
  });

  const [resetSessionMutation, { loading: isResetting }] = useMutation(resetClassMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Reset session failed:", err, t.actionFeedback.resetError),
  });

  const [overrideRateMutation, { loading: isOverridingRate }] = useMutation(overrideClassInstanceRateMutationDocument, {
    onCompleted: refetchCompleted,
    onError: err => reportMutationError("Override rate failed:", err, t.instanceDetails.overrideError),
  });

  const lifecycleHandlers = buildLifecycleHandlers(id, {
    forceActivate: vars => activateOverrideClass(vars),
    activate: vars => activateClass(vars),
    stopClass: vars => stopClassMutation(vars),
    deleteClass: vars => deleteClassMutation(vars),
  });

  const sessionHandlers = buildSessionHandlers(id, {
    start: vars => startSessionMutation(vars),
    markAbsent: vars => markAbsentMutation(vars),
    processLeave: vars => processLeaveMutation(vars),
    reset: vars => resetSessionMutation(vars),
    overrideRate: vars => overrideRateMutation(vars),
  });

  return {
    ...lifecycleHandlers,
    ...sessionHandlers,
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
    isOverridingRate,
  };
}
