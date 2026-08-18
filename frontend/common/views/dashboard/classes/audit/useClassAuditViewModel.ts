"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { GroupClassAudit } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  ClassAuditLabels,
  ClassAuditViewProps,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ClassAuditLabels as ClassAuditLocaleLabels } from "@/shared/locale/types/dashboard/classes/audit";

export interface ClassAuditViewModel extends Omit<ClassAuditViewProps, "audit" | "labels"> {
  readonly status: "loading" | "invalidId" | "error" | "ready";
  readonly audit: NonNullable<GroupClassAudit> | null;
  readonly labels: ClassAuditLabels | Record<string, never>;
}

export type UseClassAuditViewModelProps = Record<string, never>;

type ClassAuditT = ClassAuditLocaleLabels;
type Audit = NonNullable<ClassAuditViewProps["audit"]>;
type MaybeAudit = Audit | null | undefined;

export function useClassAuditViewModel(): ClassAuditViewModel {
  const t = useAppTranslation(Translation.Dashboard.ClassAudit);
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { audit, loading, error, resendNotifications, isResending } = useClassAuditData(id);
  const handlers = useClassAuditHandlers({ id, audit, router, resendNotifications, t });

  if (loading && !audit) {
    return createStubClassAuditViewModel("loading");
  }
  if (!id) {
    return createStubClassAuditViewModel("invalidId");
  }
  if (error || !audit) {
    logger.error("Error fetching class audit:", error);
    return createStubClassAuditViewModel("error");
  }

  return {
    status: "ready",
    audit,
    labels: buildClassAuditLabels(t, audit),
    ...handlers,
    isResending,
  };
}

type StubStatus = "loading" | "invalidId" | "error";

function createStubClassAuditViewModel(status: StubStatus): ClassAuditViewModel {
  return {
    status,
    audit: null,
    labels: {},
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

function useClassAuditData(id: string) {
  const { data, loading, error } = useQuery(groupClassAuditQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id,
  });
  const [resendNotifications, { loading: isResending }] = useMutation(resendClassNotificationsMutationDocument);
  return {
    audit: data?.groupClassAudit,
    loading,
    error,
    resendNotifications,
    isResending,
  };
}

interface ClassAuditHandlersArgs {
  readonly id: string;
  readonly audit: MaybeAudit;
  readonly router: ReturnType<typeof useRouter>;
  readonly resendNotifications: ReturnType<typeof useMutation>[0];
  readonly t: ClassAuditT;
}

function useClassAuditHandlers({ id, audit, router, resendNotifications, t }: ClassAuditHandlersArgs) {
  const csvHeaders = useMemo(
    () => [t.students.studentName, t.students.idNumber, t.students.attendanceStatus] as const,
    [t]
  );

  const onGenerateReport = useCallback(() => {
    if (!audit) {
      return;
    }
    exportToCsv(audit.students ?? [], "class-audit", id, csvHeaders);
  }, [audit, id, csvHeaders]);

  const onEditClass = useCallback(() => {
    router.push(`/schedule/tracking/reschedule?classInstanceId=${id}`);
  }, [router, id]);

  const onExportStudents = useCallback(() => {
    if (!audit) {
      return;
    }
    exportToCsv(audit.students ?? [], "students", id, csvHeaders);
  }, [audit, id, csvHeaders]);

  const onViewStudent = useCallback(
    (studentId: string) => {
      router.push(studentProfileTabHref(studentId, "status"));
    },
    [router]
  );

  const onResendNotifications = useCallback(() => {
    resendNotifications({ variables: { classInstanceId: id } });
  }, [resendNotifications, id]);

  return {
    onGenerateReport,
    onEditClass,
    onExportStudents,
    onViewStudent,
    onResendNotifications,
    onUpdateAdminNote: noopAdminNoteHandler,
    onEditAdminNote: noopAdminNoteHandler,
  };
}

function buildClassAuditLabels(t: ClassAuditT, audit: Audit): ClassAuditLabels {
  const registeredStudentCount = audit.registeredStudentCount ?? 0;
  return {
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
    registeredStudents: buildRegisteredStudentsLabels(t, registeredStudentCount),
    meetingInfo: buildMeetingInfoLabels(t),
    communicationLog: {
      title: t.communication.title,
      resendNotifications: t.communication.resendNotifications,
    },
    adminNote: {
      title: t.adminNote.title,
      titleMobile: t.adminNote.titleMobile,
      lastUpdated: t.adminNote.lastUpdated(audit.adminNote?.lastUpdated ?? ""),
      update: t.adminNote.update,
      edit: t.adminNote.edit,
    },
  };
}

function buildRegisteredStudentsLabels(t: ClassAuditT, registeredStudentCount: number) {
  return {
    title: t.students.title(registeredStudentCount),
    exportList: t.students.exportList,
    studentName: t.students.studentName,
    idNumber: t.students.idNumber,
    attendanceStatus: t.students.attendanceStatus,
    actions: t.students.actions,
    student: t.students.student,
    status: t.students.status,
    viewAll: t.students.viewAll(registeredStudentCount),
    pending: t.students.pending,
    present: t.students.present,
    absent: t.students.absent,
    noEntries: t.students.noEntries,
    viewStudentAriaLabel: t.students.viewStudentAriaLabel,
  };
}

function buildMeetingInfoLabels(t: ClassAuditT) {
  return {
    title: t.meeting.title,
    joinMeeting: t.meeting.joinMeeting,
    capacityBadge: t.venue.capacityBadge(0),
    capacity: t.venue.capacity(0),
    meetingIdLabel: t.meetingIdLabel,
    online: t.online,
    meetingIdNA: t.meetingIdNA,
  };
}

const noopAdminNoteHandler = (): void => {
  // Admin-note edit dialog wiring is intentionally a no-op for Plan v5 because
  // the dedicated admin-note edit dialog component has not been lifted into the
  // tier `/audit` folder yet. Implementing the dialog is tracked outside of
  // Plan v5; touch `_noteDialogOpen`/`_noteContent` then.
};

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
