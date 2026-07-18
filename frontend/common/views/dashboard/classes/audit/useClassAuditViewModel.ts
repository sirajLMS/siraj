"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

export interface ClassAuditViewModel extends ClassAuditViewProps {
  readonly status: "loading" | "invalidId" | "error" | "ready";
}

export type UseClassAuditViewModelProps = Record<string, never>;

export function useClassAuditViewModel(): ClassAuditViewModel {
  const router = useRouter();
  const t = useAppTranslation().dashboardTranslations.classAudit;

  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";

  const { data, loading, error } = useQuery(groupClassAuditQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id,
  });

  const [resendNotifications, { loading: isResending }] = useMutation(resendClassNotificationsMutationDocument);

  const audit = data?.groupClassAudit;

  if (loading && !data) {
    return createStubClassAuditViewModel("loading");
  }

  if (!id) {
    return createStubClassAuditViewModel("invalidId");
  }

  if (error || !audit) {
    logger.error("Error fetching class audit:", error);
    return createStubClassAuditViewModel("error");
  }

  const labels = {
    breadcrumbs: {
      dashboard: t.breadcrumbs.dashboard,
      schedules: t.breadcrumbs.schedules,
      current: t.breadcrumbs.current,
    },
    pageTitle: t.pageTitle,
    mobileTitle: t.mobileTitle,
    generateReport: t.actions.generateReport,
    editClass: t.actions.editClass,
    courseCode: t.fields.courseCode,
    teacher: t.fields.teacher,
    originalDate: t.fields.originalDate,
    rescheduledDate: t.fields.rescheduledDate,
    timeSlot: t.fields.timeSlot,
    venue: t.fields.venue,
    auditTrailTitle: t.auditTrail.title,
    statusRescheduled: t.status.regularRescheduled,
    classDetails: t.fields.classDetails,
    registeredStudents: {
      title: t.students.title(audit?.registeredStudentCount ?? 0),
      exportList: t.students.exportList,
      studentName: t.students.studentName,
      idNumber: t.students.idNumber,
      attendanceStatus: t.students.attendanceStatus,
      actions: t.students.actions,
      student: t.students.student,
      status: t.students.status,
      viewAll: t.students.viewAll(audit?.registeredStudentCount ?? 0),
      pending: t.students.pending,
      present: t.students.present,
      absent: t.students.absent,
      noEntries: t.students.noEntries,
    },
    meetingInfo: {
      title: t.meeting.title,
      joinMeeting: t.meeting.joinMeeting,
      capacityBadge: t.venue.capacityBadge(0),
      capacity: t.venue.capacity(0),
      meetingIdLabel: t.meetingIdLabel,
      online: t.online,
      meetingIdNA: t.meetingIdNA,
    },
    communicationLog: {
      title: t.communication.title,
      resendNotifications: t.communication.resendNotifications,
    },
    adminNote: {
      title: t.adminNote.title,
      titleMobile: t.adminNote.titleMobile,
      lastUpdated: t.adminNote.lastUpdated(audit?.adminNote?.lastUpdated ?? ""),
      update: t.adminNote.update,
      edit: t.adminNote.edit,
    },
  };

  const csvHeaders = [t.students.studentName, t.students.idNumber, t.students.attendanceStatus] as const;

  const handleGenerateReport = useCallback(() => {
    exportToCsv(audit?.students ?? [], "class-audit", id, csvHeaders);
  }, [audit?.students, id, csvHeaders]);

  const handleEditClass = useCallback(() => {
    router.push(`/reschedule?classInstanceId=${id}`);
  }, [router, id]);

  const handleExportStudents = useCallback(() => {
    exportToCsv(audit?.students ?? [], "students", id, csvHeaders);
  }, [audit?.students, id, csvHeaders]);

  const handleViewStudent = useCallback(
    (studentId: string) => {
      router.push(studentProfileTabHref(studentId, "status"));
    },
    [router]
  );

  const handleResendNotifications = useCallback(() => {
    resendNotifications({ variables: { classInstanceId: id } });
  }, [resendNotifications, id]);

  return {
    status: "ready",
    audit,
    labels,
    onGenerateReport: handleGenerateReport,
    onEditClass: handleEditClass,
    onExportStudents: handleExportStudents,
    onViewStudent: handleViewStudent,
    onResendNotifications: handleResendNotifications,
    onUpdateAdminNote: noopAdminNoteHandler,
    onEditAdminNote: noopAdminNoteHandler,
    isResending,
  };
}

const noopAdminNoteHandler = (): void => {
  // Admin-note edit dialog wiring is intentionally a no-op for Plan v5 because
  // the dedicated admin-note edit dialog component has not been lifted into the
  // tier `/audit` folder yet. Implementing the dialog is tracked outside of
  // Plan v5; touch `_noteDialogOpen`/`_noteContent` then.
};

function createStubClassAuditViewModel(status: "loading" | "invalidId" | "error"): ClassAuditViewModel {
  return {
    status,
    audit: null as unknown as ClassAuditViewModel["audit"],
    labels: {} as unknown as ClassAuditViewModel["labels"],
    onGenerateReport: noopAdminNoteHandler,
    onEditClass: noopAdminNoteHandler,
    onExportStudents: noopAdminNoteHandler,
    onViewStudent: noopAdminNoteHandler,
    onResendNotifications: noopAdminNoteHandler,
    onUpdateAdminNote: noopAdminNoteHandler,
    onEditAdminNote: noopAdminNoteHandler,
    isResending: false,
  };
}

function exportToCsv(
  students: readonly {
    readonly name?: string | null;
    readonly studentId?: string | null;
    readonly attendanceStatus?: string | null;
  }[],
  filename: string,
  id: string,
  headers: readonly [string, string, string]
) {
  try {
    const filtered = students.filter((s): s is NonNullable<typeof s> => s != null);
    const csvRows = [
      headers.join(","),
      ...filtered.map(s => [s.name ?? "", s.studentId ?? "", s.attendanceStatus ?? ""].join(",")),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    logger.error("Error generating report:", err);
  }
}
