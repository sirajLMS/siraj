"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { classInstanceQueryDocument, rescheduleClassMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { useRescheduleStore } from "@/frontend/stores/rescheduleStore";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { RescheduleView } from "./RescheduleView";
import { type RescheduleFormData, rescheduleSchema } from "./schemas/rescheduleSchema";
import { combineDateTime } from "./utils/rescheduleDateTime";

export function RescheduleContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("dashboard.rescheduleForm");
  const storeSession = useRescheduleStore(state => state.session);
  const classInstanceId = searchParams.get("classInstanceId") || storeSession.sessionId || "";

  const [showSuccess, setShowSuccess] = useState(false);

  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id: classInstanceId },
    skip: !classInstanceId,
  });

  const [rescheduleClass, { loading: isSubmitting }] = useMutation(rescheduleClassMutationDocument);

  const classInstance = data?.classInstance;

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      newDate: "",
      newTime: "",
    },
  });

  useEffect(() => {
    if (classInstance) {
      reset({
        newDate: classInstance.scheduledDate ?? "",
        newTime: classInstance.startTime ?? "",
      });
    }
  }, [classInstance, reset]);

  const fallbackSession = useMemo(
    () => ({
      sessionId: storeSession.sessionId,
      teacherName: storeSession.teacherName,
      studentName: storeSession.studentName,
      teacherTimezone: storeSession.teacherTimezone,
    }),
    [storeSession]
  );

  const session = classInstance
    ? {
        sessionId: classInstance.id ?? "",
        teacherName: classInstance.teacher?.name ?? "",
        studentName: classInstance.student?.name ?? "",
        teacherTimezone: classInstance.teacherTimezone ?? IanaTimezone.Utc,
      }
    : fallbackSession;

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!classInstanceId || !classInstance) {
    logger.error("Error fetching class details for rescheduling:", error);
    return <Box sx={{ p: 3, textAlign: "center" }}>{t("classInstanceNotFound")}</Box>;
  }

  const onSubmit = async (formData: RescheduleFormData) => {
    const startAt = combineDateTime(formData.newDate, formData.newTime);
    if (!startAt) {
      logger.error("Invalid date or time format for reschedule");
      return;
    }
    const durationMinutes = classInstance.durationMinutes ?? 60;
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
  };

  const onCancel = () => {
    router.push(`/classes/${classInstanceId}`);
  };

  return (
    <RequirePermission permissions={[AppPermission.SessionReschedule]}>
      <RescheduleView
        session={session}
        control={control}
        errors={errors}
        setValue={setValue}
        getValues={getValues}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        showSuccess={showSuccess}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDismissSuccess={() => {
          setShowSuccess(false);
        }}
      />
    </RequirePermission>
  );
}
