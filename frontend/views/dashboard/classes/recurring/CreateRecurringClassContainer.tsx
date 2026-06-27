"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import type { CreateRecurringClassInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { createRecurringClassMutationDocument } from "@/frontend/graphql/sharedDocuments/recurring-class.documents";
import { useCreateRecurringClassStore } from "@/frontend/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { mapFormDataToInput } from "./actions/createRecurringClass";
import { CreateRecurringClassView } from "./CreateRecurringClassView";
import type { RecurringClassFormData } from "./recurringClassSchema";

export function CreateRecurringClassContainer() {
  const t = useTranslations("dashboard.createRecurringClass");
  const router = useRouter();
  const permissions = useUserStore(state => state.permissions);

  const isSubmitting = useCreateRecurringClassStore(state => state.isSubmitting);
  const showSuccess = useCreateRecurringClassStore(state => state.showSuccess);
  const errorMessage = useCreateRecurringClassStore(state => state.errorMessage);
  const setSubmitting = useCreateRecurringClassStore(state => state.setSubmitting);
  const setShowSuccess = useCreateRecurringClassStore(state => state.setShowSuccess);
  const resetSuccess = useCreateRecurringClassStore(state => state.resetSuccess);
  const setErrorMessage = useCreateRecurringClassStore(state => state.setErrorMessage);
  const clearError = useCreateRecurringClassStore(state => state.clearError);

  const canCreate = permissions.includes(AppPermission.ScheduleManageRecurring);

  const [createClassMutation] = useMutation(createRecurringClassMutationDocument);

  const handleClose = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleSubmit = useCallback(
    async (data: RecurringClassFormData) => {
      setSubmitting(true);
      resetSuccess();
      clearError();

      try {
        const input: CreateRecurringClassInput = mapFormDataToInput(data);

        const { data: result } = await createClassMutation({
          variables: { input },
        });

        if (result?.createRecurringClass) {
          setShowSuccess(true);
          logger.info("Recurring class created:", result.createRecurringClass.id);

          const classId = result.createRecurringClass.recurringScheduleId ?? result.createRecurringClass.id;
          if (classId) {
            setTimeout(() => {
              router.push(`/classes/${classId}`);
            }, 1500);
          }
        } else {
          setErrorMessage(t("validation.creationFailed"));
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error("Error creating recurring class", { err: error });
        setErrorMessage(error.message || t("validation.creationFailed"));
      } finally {
        setSubmitting(false);
      }
    },
    [createClassMutation, setSubmitting, resetSuccess, clearError, setShowSuccess, setErrorMessage, router, t]
  );

  const labels = useMemo(
    () => ({
      title: t("title"),
      subtitle: t("subtitle"),
      breadcrumbs: {
        dashboard: t("breadcrumbs.dashboard"),
        classes: t("breadcrumbs.classes"),
      },
      add: t("add"),
      addClass: t("addClass"),
      addedSuccessfully: t("addedSuccessfully"),
      close: t("close"),
      students: t("students"),
      studentsPlaceholder: t("studentsPlaceholder"),
      teacher: t("teacher"),
      teacherPlaceholder: t("teacherPlaceholder"),
      defaultStartTime: t("defaultStartTime"),
      duration: t("duration"),
      durationHours: t("durationHours"),
      durationMinutes: t("durationMinutes"),
      hours: t("hours"),
      minutes: t("minutes"),
      daysSelection: t("daysSelection"),
      classSchedule: t("classSchedule"),
      timeOverride: t("timeOverride"),
      weekendOff: t("weekendOff"),
      timezone: t("timezone"),
      timezonePlaceholder: t("timezonePlaceholder"),
      classType: t("classType"),
      classTypePlaceholder: t("classTypePlaceholder"),
      days: {
        monday: t("days.monday"),
        tuesday: t("days.tuesday"),
        wednesday: t("days.wednesday"),
        thursday: t("days.thursday"),
        friday: t("days.friday"),
        saturday: t("days.saturday"),
        sunday: t("days.sunday"),
      },
      validation: {
        studentRequired: t("validation.studentRequired"),
        teacherRequired: t("validation.teacherRequired"),
        startTimeRequired: t("validation.startTimeRequired"),
        durationRequired: t("validation.durationRequired"),
        daysRequired: t("validation.daysRequired"),
        durationHoursMax: t("validation.durationHoursMax"),
        durationMinutesMax: t("validation.durationMinutesMax"),
        timezoneRequired: t("validation.timezoneRequired"),
        creationFailed: t("validation.creationFailed"),
      },
    }),
    [t]
  );

  if (!canCreate) {
    return null;
  }

  return (
    <CreateRecurringClassView
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      errorMessage={errorMessage}
      labels={labels}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onDismissSuccess={resetSuccess}
      onDismissError={clearError}
    />
  );
}
