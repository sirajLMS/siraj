"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { type RefObject, useCallback, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { changeStudentStatusMutationDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-lifecycle.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { logger } from "@/frontend/common/utils/logger";
import type { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/useStudentProfileContext";
import {
  createStatusUpdateSchema,
  type StatusUpdateFormData,
} from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import type { QueryResult } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel.hooks";
import type { CommonLabels, StudentStatusLabels } from "@/shared/locale";

export function useChangeStudentStatusMutation(env: {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly refetchUpcoming: QueryResult["refetchUpcoming"];
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
  readonly t: StudentStatusLabels;
  readonly tc: CommonLabels;
}) {
  const { studentId, useUnifiedProfile, refetchUpcoming, profileContext, t, tc } = env;
  const notifications = useNotifications();

  const handleMutationCompleted = useCallback(() => {
    notifications.show(t.successMessage, {
      severity: "success",
      autoHideDuration: 5000,
    });
    if (useUnifiedProfile) {
      profileContext?.refetch()?.catch(() => undefined);
    } else {
      refetchUpcoming?.()?.catch(() => undefined);
    }
  }, [notifications, t, useUnifiedProfile, profileContext, refetchUpcoming]);

  const handleMutationError = useCallback(
    (error: unknown) => {
      logger.error("Change student status failed:", { error });
      notifications.show(tc.operationFailed, {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
    [notifications, tc]
  );

  const refetchQueries = useUnifiedProfile
    ? [
        {
          query: studentProfileQueryDocument,
          variables: { studentId, year: null, month: null, includeUpcomingClasses: true },
        },
      ]
    : [{ query: studentByIdQueryDocument, variables: { studentId } }];

  const [changeStatus, { loading: isUpdating }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: handleMutationCompleted,
    onError: handleMutationError,
    refetchQueries,
  });

  return { changeStatus, isUpdating };
}

export function useStudentStatusFormState(env: {
  readonly student: StudentStatusPageData | null;
  readonly studentId: string;
  readonly t: StudentStatusLabels;
  readonly changeStatus: ReturnType<typeof useChangeStudentStatusMutation>["changeStatus"];
  readonly versionRef: RefObject<number | null>;
}) {
  const { student, studentId, t, changeStatus, versionRef } = env;
  const schema = createStatusUpdateSchema(t.validation);

  const methods = useForm<StatusUpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: StudentStatus.Regular,
      reason: "",
    },
  });

  const selectedStatus = useWatch({ control: methods.control, name: "status", defaultValue: StudentStatus.Regular });

  useEffect(() => {
    methods.reset({
      status: student?.status ?? StudentStatus.Regular,
      reason: "",
    });
  }, [student, methods]);

  const handleSubmit = async (data: StatusUpdateFormData) => {
    await changeStatus({
      variables: {
        studentId,
        newStatus: data.status,
        expectedVersion: versionRef.current,
      },
    });
    methods.reset({ status: data.status, reason: "" });
  };

  return { methods, selectedStatus, handleSubmit };
}

export function useUpdateStatusHandler(env: {
  readonly studentId: string;
  readonly changeStatus: ReturnType<typeof useChangeStudentStatusMutation>["changeStatus"];
  readonly versionRef: RefObject<number | null>;
}) {
  const { studentId, changeStatus, versionRef } = env;
  return useCallback(
    async (status: StudentStatus, _reason: string) => {
      if (!studentId) return;
      await changeStatus({
        variables: {
          studentId,
          newStatus: status,
          expectedVersion: versionRef.current,
        },
      });
    },
    [studentId, changeStatus, versionRef]
  );
}
