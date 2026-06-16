"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCreateRecurringClassStore } from "@/frontend/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { createRecurringClass } from "./actions/createRecurringClass";
import { CreateRecurringClassView } from "./CreateRecurringClassView";
import type { RecurringClassFormData } from "./recurringClassSchema";

export function CreateRecurringClassContainer() {
  const t = useTranslations("dashboard.createRecurringClass");
  const router = useRouter();
  const locale = useLocale();
  const permissions = useUserStore(state => state.permissions);

  const studentGroups = useCreateRecurringClassStore(state => state.studentGroups);
  const isSubmitting = useCreateRecurringClassStore(state => state.isSubmitting);
  const showSuccess = useCreateRecurringClassStore(state => state.showSuccess);
  const setSubmitting = useCreateRecurringClassStore(state => state.setSubmitting);
  const setShowSuccess = useCreateRecurringClassStore(state => state.setShowSuccess);
  const resetSuccess = useCreateRecurringClassStore(state => state.resetSuccess);

  const canCreate = permissions.includes("classes-create");

  const handleClose = () => {
    router.push(`/${locale}/dashboard`);
  };

  const handleSubmit = (data: RecurringClassFormData) => {
    setSubmitting(true);
    resetSuccess();

    createRecurringClass(data)
      .then(response => {
        if (response.success) {
          setShowSuccess(true);
          logger.info("Recurring class created:", response.classId);
        } else {
          logger.warn("Failed to create recurring class");
        }
      })
      .catch(() => {
        logger.error("Error creating recurring class");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (!canCreate) {
    return null;
  }

  const labels = {
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
      studentGroupRequired: t("validation.studentGroupRequired"),
      startTimeRequired: t("validation.startTimeRequired"),
      durationRequired: t("validation.durationRequired"),
      daysRequired: t("validation.daysRequired"),
      durationHoursMax: t("validation.durationHoursMax"),
      durationMinutesMax: t("validation.durationMinutesMax"),
    },
  };

  return (
    <CreateRecurringClassView
      studentGroups={studentGroups}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      labels={labels}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onDismissSuccess={resetSuccess}
    />
  );
}
