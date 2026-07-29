"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect } from "react";
import { logTeacherSupportRequestMutationDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import type { SupportRequestType } from "@/frontend/common/stores/teacherDashboardStore";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import { logger } from "@/frontend/common/utils/logger";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface TeacherSupportIslandProps {
  readonly labels: TeacherDashboardViewLabels;
}

/**
 * Owns the `logTeacherSupportRequest` mutation and registers
 * `onContactCoordinator` and `onSupport` on the shared store. Both surface a
 * success snackbar via the store; the request target is encoded in the
 * mutation `reason` string.
 */
export function TeacherSupportIsland({ labels }: Readonly<TeacherSupportIslandProps>) {
  const setHandlers = useTeacherDashboardStore(state => state.setHandlers);
  const showSnackbar = useTeacherDashboardStore(state => state.showSnackbar);

  const [logSupportRequest] = useMutation(logTeacherSupportRequestMutationDocument);

  const handleSupportRequest = useCallback(
    async (type: SupportRequestType) => {
      try {
        await logSupportRequest({
          variables: {
            input: {
              reason: `${type}: Support request initiated from teacher dashboard.`,
            },
          },
        });
        showSnackbar(labels.supportRequestSubmitted(type.toLowerCase()), "success");
      } catch (err) {
        logger.error("Error logging support request:", err);
      }
    },
    [logSupportRequest, showSnackbar, labels]
  );

  const handleContactCoordinator = useCallback(() => {
    void handleSupportRequest("COORDINATOR");
  }, [handleSupportRequest]);

  const handleSupport = useCallback(() => {
    void handleSupportRequest("SUPPORT");
  }, [handleSupportRequest]);

  useEffect(() => {
    setHandlers({
      onContactCoordinator: handleContactCoordinator,
      onSupport: handleSupport,
    });
  }, [handleContactCoordinator, handleSupport, setHandlers]);

  return null;
}
