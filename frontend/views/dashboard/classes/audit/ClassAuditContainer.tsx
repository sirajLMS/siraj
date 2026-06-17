"use client";

import { useTranslations } from "next-intl";
import { useClassAuditStore } from "@/frontend/stores/mockClassAuditStore";
import { logger } from "@/frontend/utils/logger";
import { ClassAuditView } from "./ClassAuditView";

export function ClassAuditContainer() {
  const t = useTranslations("dashboard.classAudit");

  const audit = useClassAuditStore(state => state.audit);
  const resendNotifications = useClassAuditStore(state => state.resendNotifications);
  const updateAdminNote = useClassAuditStore(state => state.updateAdminNote);

  const labels = {
    breadcrumbs: {
      dashboard: t("breadcrumbs.dashboard"),
      schedules: t("breadcrumbs.schedules"),
      current: t("breadcrumbs.current"),
    },
    pageTitle: t("pageTitle"),
    mobileTitle: t("mobileTitle"),
    generateReport: t("actions.generateReport"),
    editClass: t("actions.editClass"),
    courseCode: t("fields.courseCode"),
    teacher: t("fields.teacher"),
    originalDate: t("fields.originalDate"),
    rescheduledDate: t("fields.rescheduledDate"),
    timeSlot: t("fields.timeSlot"),
    venue: t("fields.venue"),
    auditTrailTitle: t("auditTrail.title"),
    statusRescheduled: t("status.regularRescheduled"),
    classDetails: t("fields.classDetails"),
    registeredStudents: {
      title: t("students.title", { count: audit.registeredStudentCount }),
      exportList: t("students.exportList"),
      studentName: t("students.studentName"),
      idNumber: t("students.idNumber"),
      attendanceStatus: t("students.attendanceStatus"),
      actions: t("students.actions"),
      student: t("students.student"),
      status: t("students.status"),
      viewAll: t("students.viewAll", { count: audit.registeredStudentCount }),
      pending: t("students.pending"),
      present: t("students.present"),
      absent: t("students.absent"),
      noEntries: t("students.noEntries"),
    },
    venueLocation: {
      title: t("venue.title"),
      capacity: t("venue.capacity", { count: audit.venueInfo.capacity }),
      viewMap: t("venue.viewMap"),
      capacityBadge: t("venue.capacityBadge", { count: audit.venueInfo.capacity }),
    },
    communicationLog: {
      title: t("communication.title"),
      resendNotifications: t("communication.resendNotifications"),
    },
    adminNote: {
      title: t("adminNote.title"),
      titleMobile: t("adminNote.titleMobile"),
      lastUpdated: t("adminNote.lastUpdated", { time: audit.adminNote.lastUpdated }),
      update: t("adminNote.update"),
      edit: t("adminNote.edit"),
    },
  };

  return (
    <ClassAuditView
      audit={audit}
      labels={labels}
      onGenerateReport={() => {
        logger.info("Generate audit report:", audit.id);
      }}
      onEditClass={() => {
        logger.info("Edit class:", audit.id);
      }}
      onExportStudents={() => {
        logger.info("Export student list:", audit.id);
      }}
      onViewStudent={id => {
        logger.info("View student:", id);
      }}
      onViewMap={() => {
        logger.info("View venue map:", audit.venueInfo.name);
      }}
      onResendNotifications={resendNotifications}
      onUpdateAdminNote={updateAdminNote}
      onEditAdminNote={() => {
        logger.info("Edit admin note:", audit.id);
      }}
    />
  );
}
