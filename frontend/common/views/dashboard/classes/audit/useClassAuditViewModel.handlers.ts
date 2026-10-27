"use client";

import type { useMutation } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  AdminNoteDialogStateWithOpen,
  ClassAuditT,
  MaybeAudit,
} from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel.types";
import type { useRouter } from "@/shared/i18n/navigation";
import { toCsvCell } from "@/shared/lib/csv/csv-cell";

interface ClassAuditHandlersArgs {
  readonly id: string;
  readonly audit: MaybeAudit;
  readonly router: ReturnType<typeof useRouter>;
  readonly resendNotifications: ReturnType<typeof useMutation>[0];
  readonly t: ClassAuditT;
  readonly adminNote: AdminNoteDialogStateWithOpen;
}

export function useClassAuditHandlers({
  id,
  audit,
  router,
  resendNotifications,
  t,
  adminNote,
}: ClassAuditHandlersArgs) {
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
    onUpdateAdminNote: adminNote.openDialog,
    onEditAdminNote: adminNote.openDialog,
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
      headers.map(toCsvCell).join(","),
      ...filtered.map(s =>
        [toCsvCell(s.name ?? ""), toCsvCell(s.studentId ?? ""), toCsvCell(s.attendanceStatus ?? "")].join(",")
      ),
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
