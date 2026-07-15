"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  activateClassMutationDocument,
  activateOverrideClassMutationDocument,
  classInstanceQueryDocument,
  deleteClassInstanceMutationDocument,
  resetClassMutationDocument,
  stopClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale/client";

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
  isStarting: boolean;
  isMarkingAbsent: boolean;
  isProcessingLeave: boolean;
  isResetting: boolean;
}

export function useClassMutations({ id, onError }: UseClassMutationsOptions): UseClassMutationsReturn {
  const t = useAppTranslation("dashboard.classDetails");
  const client = useApolloClient();

  const reportMutationError = (context: string, err: unknown, fallbackKey: string) => {
    logger.error(context, { err });
    // fallbackKey is now in dot notation like "actionFeedback.activateError"
    const keys = fallbackKey.split(".");
    let fallbackValue: any = t;
    for (const key of keys) {
      fallbackValue = fallbackValue[key];
    }
    onError?.(getGraphQLErrorMessage(err, fallbackValue));
  };

  const [activateClass] = useMutation(activateClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Activate class failed:", err, "actionFeedback.activateError");
    },
  });

  const [activateOverrideClass] = useMutation(activateOverrideClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Activate override class failed:", err, "actionFeedback.forceActivateError");
    },
  });

  const [stopClassMutation] = useMutation(stopClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Stop class failed:", err, "actionFeedback.stopError");
    },
  });

  const [deleteClassMutation] = useMutation(deleteClassInstanceMutationDocument, {
    onError: err => {
      reportMutationError("Delete class failed:", err, "actionFeedback.deleteError");
    },
  });

  const [startSessionMutation, { loading: isStarting }] = useMutation(updateSessionStatusStartMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Start session failed:", err, "actionFeedback.startError");
    },
  });

  const [markAbsentMutation, { loading: isMarkingAbsent }] = useMutation(updateSessionStatusAbsentMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Mark absent failed:", err, "actionFeedback.markAbsentError");
    },
  });

  const [processLeaveMutation, { loading: isProcessingLeave }] = useMutation(updateSessionStatusLeaveMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Process leave failed:", err, "actionFeedback.leaveError");
    },
  });

  const [resetSessionMutation, { loading: isResetting }] = useMutation(resetClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      reportMutationError("Reset session failed:", err, "actionFeedback.resetError");
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

  return {
    forceActivate,
    activate,
    stopClass,
    deleteClass,
    startSession,
    markAbsent,
    processLeave,
    resetSession,
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
  };
}
