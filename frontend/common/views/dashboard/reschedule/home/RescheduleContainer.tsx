"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { LoadingState } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classInstanceQueryDocument, rescheduleClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useRescheduleStore } from "@/frontend/common/stores/rescheduleStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  type RescheduleViewModel,
  type UseRescheduleViewModelProps,
  useRescheduleViewModel,
} from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import { combineDateTime } from "@/frontend/common/views/dashboard/reschedule/home/utils/rescheduleDateTime";
import { useRouter } from "@/shared/i18n/navigation";

const lazyViews = createLazyView<RescheduleViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reschedule/home/rescheduleView.mobile").then(m => ({
      default: m.RescheduleViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/reschedule/home/rescheduleView.desktop").then(m => ({
      default: m.RescheduleViewDesktop,
    }))
);

export function RescheduleContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSession = useRescheduleStore(state => state.session);
  const setShowSuccess = useRescheduleStore(state => state.setShowSuccess);
  const classInstanceId = searchParams.get("classInstanceId") ?? storeSession.sessionId ?? "";

  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id: classInstanceId },
    skip: !classInstanceId,
  });

  const [rescheduleClass, { loading: isSubmitting }] = useMutation(rescheduleClassMutationDocument);

  const classInstance = data?.classInstance;

  useEffect(() => {
    setShowSuccess(false);
  }, [setShowSuccess]);

  const fallbackSession = useMemo(
    () => ({
      sessionId: storeSession.sessionId,
      teacherName: storeSession.teacherName,
      studentName: storeSession.studentName,
      teacherTimezone: storeSession.teacherTimezone,
    }),
    [storeSession]
  );

  const session = useMemo<UseRescheduleViewModelProps["session"]>(
    () =>
      classInstance
        ? {
            sessionId: classInstance.id ?? "",
            teacherName: classInstance.teacher?.name ?? "",
            studentName: classInstance.student?.name ?? "",
            teacherTimezone: classInstance.teacherTimezone ?? IanaTimezone.Utc,
            effectiveMeeting: classInstance.effectiveMeeting ?? null,
          }
        : fallbackSession,
    [classInstance, fallbackSession]
  );

  const defaultDate = classInstance?.scheduledDate ?? "";
  const defaultTime = classInstance?.startTime ?? "";

  const onSubmit = useCallback(
    async (
      formData: import("@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema").RescheduleFormData
    ) => {
      const startAt = combineDateTime(formData.newDate, formData.newTime);
      if (!startAt) {
        logger.error("Invalid date or time format for reschedule");
        return;
      }
      const durationMinutes = classInstance?.durationMinutes ?? 60;
      const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

      try {
        const { data: mutationResult } = await rescheduleClass({
          variables: {
            classInstanceId,
            input: {
              scheduledStartAt: startAt.toISOString(),
              scheduledEndAt: endAt.toISOString(),
              durationMinutes,
            },
          },
        });

        if (mutationResult?.rescheduleClass?.id) {
          setShowSuccess(true);
          setTimeout(() => {
            router.push(`/classes/${mutationResult.rescheduleClass?.id}`);
          }, 1500);
        }
      } catch (err) {
        logger.error("Failed to reschedule class:", err);
      }
    },
    [classInstance, rescheduleClass, classInstanceId, setShowSuccess, router]
  );

  const onCancel = useCallback(() => {
    router.push(`/classes/${classInstanceId}`);
  }, [router, classInstanceId]);

  const props = useMemo<UseRescheduleViewModelProps>(
    () => ({
      session,
      defaultDate,
      defaultTime,
      isSubmitting,
      onSubmit,
      onCancel,
    }),
    [session, defaultDate, defaultTime, isSubmitting, onSubmit, onCancel]
  );

  const viewModel = useRescheduleViewModel(props);

  if (loading && !data) {
    return <LoadingState />;
  }

  if (!classInstanceId || !classInstance) {
    logger.error("Error fetching class details for rescheduling:", error);
    return <Box sx={{ p: 3, textAlign: "center" }}>{viewModel.labels.classInstanceNotFound}</Box>;
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
export type { RescheduleViewModel, UseRescheduleViewModelProps };
