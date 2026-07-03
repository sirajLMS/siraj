"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
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
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";

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
  const t = useTranslations("dashboard.classDetails");
  const client = useApolloClient();

  const [activateClass] = useMutation(activateClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Activate class failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [activateOverrideClass] = useMutation(activateOverrideClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Activate override class failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [stopClassMutation] = useMutation(stopClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Stop class failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [deleteClassMutation] = useMutation(deleteClassInstanceMutationDocument, {
    onError: err => {
      logger.error("Delete class failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [startSessionMutation, { loading: isStarting }] = useMutation(updateSessionStatusStartMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Start session failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [markAbsentMutation, { loading: isMarkingAbsent }] = useMutation(updateSessionStatusAbsentMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Mark absent failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [processLeaveMutation, { loading: isProcessingLeave }] = useMutation(updateSessionStatusLeaveMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Process leave failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const [resetSessionMutation, { loading: isResetting }] = useMutation(resetClassMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => {
      logger.error("Reset session failed:", { err });
      onError?.(t("loadError"));
    },
  });

  const forceActivate = async () => {
    try {
      await activateOverrideClass({ variables: { classInstanceId: id } });
      logger.info("Admin force-activated session:", id);
    } catch (err) {
      logger.error("Error in activateOverrideClass:", err);
    }
  };

  const activate = async () => {
    try {
      await activateClass({ variables: { classInstanceId: id } });
      logger.info("Teacher activated session:", id);
    } catch (err) {
      logger.error("Error in activateClass:", err);
    }
  };

  const stopClass = async () => {
    try {
      await stopClassMutation({ variables: { classInstanceId: id } });
      logger.info("Stopped session:", id);
    } catch (err) {
      logger.error("Error in stopClass:", err);
    }
  };

  const deleteClass = async () => {
    try {
      await deleteClassMutation({ variables: { classInstanceId: id } });
      logger.warn("Deleted class instance:", id);
    } catch (err) {
      logger.error("Error in deleteClass:", err);
      throw err; // Re-throw to handle in the component for navigation
    }
  };

  const startSession = async () => {
    try {
      await startSessionMutation({ variables: { classInstanceId: id } });
    } catch (err) {
      logger.error("Error starting session:", err);
    }
  };

  const markAbsent = async () => {
    try {
      await markAbsentMutation({ variables: { classInstanceId: id } });
    } catch (err) {
      logger.error("Error marking absent:", err);
    }
  };

  const processLeave = async (reason: string) => {
    try {
      await processLeaveMutation({ variables: { classInstanceId: id, leaveReason: reason } });
    } catch (err) {
      logger.error("Error processing leave:", err);
    }
  };

  const resetSession = async () => {
    try {
      await resetSessionMutation({ variables: { classInstanceId: id } });
    } catch (err) {
      logger.error("Error resetting session:", err);
    }
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
