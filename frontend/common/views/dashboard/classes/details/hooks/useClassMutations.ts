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

  const [activateClass] = useMutation(activateClassMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Activate class failed:", err, t.actionFeedback.activateError);
    },
  });

  const [activateOverrideClass] = useMutation(activateOverrideClassMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Activate override class failed:", err, t.actionFeedback.forceActivateError);
    },
  });

  const [stopClassMutation] = useMutation(stopClassMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Stop class failed:", err, t.actionFeedback.stopError);
    },
  });

  const [deleteClassMutation] = useMutation(deleteClassInstanceMutationDocument, {
    onError: err => {
      reportMutationError("Delete class failed:", err, t.actionFeedback.deleteError);
    },
  });

  const [startSessionMutation, { loading: isStarting }] = useMutation(updateSessionStatusStartMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Start session failed:", err, t.actionFeedback.startError);
    },
  });

  const [markAbsentMutation, { loading: isMarkingAbsent }] = useMutation(updateSessionStatusAbsentMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Mark absent failed:", err, t.actionFeedback.markAbsentError);
    },
  });

  const [processLeaveMutation, { loading: isProcessingLeave }] = useMutation(updateSessionStatusLeaveMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Process leave failed:", err, t.actionFeedback.leaveError);
    },
  });

  const [resetSessionMutation, { loading: isResetting }] = useMutation(resetClassMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Reset session failed:", err, t.actionFeedback.resetError);
    },
  });

  const [overrideRateMutation, { loading: isOverridingRate }] = useMutation(overrideClassInstanceRateMutationDocument, {
    onCompleted: () => {
      void client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Override rate failed:", err, t.instanceDetails.overrideError);
    },
  });

  const forceActivate = async () => {
    await activateOverrideClass({ variables: { classInstanceId: id } });
    logger.info("Admin force-activated session:", id);
  };

  const activate = async () => {
    await activateClass({ variables: { classInstanceId: id } });
    logger.info("Teacher activated session:", id);
  };

  const stopClass = async () => {
    await stopClassMutation({ variables: { classInstanceId: id } });
    logger.info("Stopped session:", id);
  };

  const deleteClass = async () => {
    await deleteClassMutation({ variables: { classInstanceId: id } });
    logger.warn("Deleted class instance:", id);
  };

  const startSession = async () => {
    await startSessionMutation({ variables: { classInstanceId: id } });
  };

  const markAbsent = async () => {
    await markAbsentMutation({ variables: { classInstanceId: id } });
  };

  const processLeave = async (reason: string) => {
    await processLeaveMutation({ variables: { classInstanceId: id, leaveReason: reason } });
  };

  const resetSession = async () => {
    await resetSessionMutation({ variables: { classInstanceId: id } });
  };

  const overrideRate = async (rateAmount: string | null, rateCurrency: CurrencyCode | null) => {
    await overrideRateMutation({ variables: { classInstanceId: id, rateAmount, rateCurrency } });
  };

  return {
    forceActivate,
    activate,
    stopClass,
    deleteClass,
    startSession,
    markAbsent,
    processLeave,
    resetSession,
    overrideRate,
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
    isOverridingRate,
  };
}
