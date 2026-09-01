"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useClassAuditStore } from "@/frontend/common/stores/classAuditStore";
import { logger } from "@/frontend/common/utils/logger";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  ClassAuditLabels,
  ClassAuditViewProps,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { buildClassAuditLabels } from "@/frontend/common/views/dashboard/classes/audit/utils/classAuditLabels.utils";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ClassAuditLabels as ClassAuditLocaleLabels } from "@/shared/locale/types/dashboard/classes/audit";

type ClassAuditT = ClassAuditLocaleLabels;
type Audit = NonNullable<ClassAuditViewProps["audit"]>;
type MaybeAudit = Audit | null | undefined;

/**
 * Admin-note edit dialog slice. Dialog state lives in `classAuditStore` so an
 * open dialog and its draft survive viewport tier switches.
 */
interface AdminNoteDialogState {
  readonly open: boolean;
  readonly content: string;
  readonly isSaving: boolean;
  readonly onContentChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

/** Shell states render loading/error chrome only — the tier views never receive stubbed handlers. */
interface ClassAuditShellViewModel {
  readonly status: "loading" | "invalidId" | "error";
  readonly audit: null;
  readonly labels: Record<string, never>;
  readonly isResending: boolean;
  /** Re-runs the audit query; used by the switcher to recover from a failed fetch. */
  readonly onRetry: () => void;
}

export interface ClassAuditReadyViewModel extends Omit<ClassAuditViewProps, "audit" | "labels"> {
  readonly status: "ready";
  readonly audit: Audit;
  readonly labels: ClassAuditLabels;
  /** Re-runs the audit query; used by the switcher to recover from a failed fetch. */
  readonly onRetry: () => void;
  readonly adminNoteDialog: AdminNoteDialogState;
}

export type ClassAuditViewModel = ClassAuditShellViewModel | ClassAuditReadyViewModel;

export function useClassAuditViewModel(): ClassAuditViewModel {
  const t = useAppTranslation(Translation.Dashboard.ClassAudit);
  const common = useAppTranslation(Translation.Common);
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { audit, loading, error, refetch, resendNotifications, isResending } = useClassAuditData(id);
  const adminNote = useClassAuditAdminNoteDialog(id, audit?.adminNote?.content ?? "", refetch);
  const handlers = useClassAuditHandlers({ id, audit, router, resendNotifications, t, adminNote });

  if (loading && !audit) {
    return { status: "loading", audit: null, labels: {}, isResending, onRetry: refetch };
  }
  if (!id) {
    return { status: "invalidId", audit: null, labels: {}, isResending, onRetry: refetch };
  }
  if (error || !audit) {
    logger.error("Error fetching class audit:", error);
    return { status: "error", audit: null, labels: {}, isResending, onRetry: refetch };
  }

  return {
    status: "ready",
    audit,
    labels: buildClassAuditLabels(t, common.cancel, audit),
    ...handlers,
    isResending,
    onRetry: refetch,
    adminNoteDialog: {
      open: adminNote.open,
      content: adminNote.content,
      isSaving: adminNote.isSaving,
      onContentChange: adminNote.onContentChange,
      onClose: adminNote.onClose,
      onSave: adminNote.onSave,
    },
  };
}

function useClassAuditData(id: string) {
  const { data, loading, error, refetch } = useQuery(groupClassAuditQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id,
  });
  const [resendNotifications, { loading: isResending }] = useMutation(resendClassNotificationsMutationDocument);
  return {
    audit: data?.groupClassAudit,
    loading,
    error,
    refetch,
    resendNotifications,
    isResending,
  };
}

interface AdminNoteDialogStateWithOpen extends AdminNoteDialogState {
  readonly openDialog: () => void;
}

function useClassAuditAdminNoteDialog(
  id: string,
  noteContent: string,
  onSaved: () => void
): AdminNoteDialogStateWithOpen {
  const open = useClassAuditStore(state => state.adminNoteDialogOpen);
  const content = useClassAuditStore(state => state.adminNoteDraft);
  const setOpen = useClassAuditStore(state => state.setAdminNoteDialogOpen);
  const setContent = useClassAuditStore(state => state.setAdminNoteDraft);
  const [updateAdminNote, { loading: isSaving }] = useMutation(updateClassAdminNoteMutationDocument);

  const openDialog = useCallback(() => {
    setContent(noteContent);
    setOpen(true);
  }, [noteContent, setContent, setOpen]);

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  const onSave = useCallback(() => {
    const save = async () => {
      try {
        await updateAdminNote({ variables: { classInstanceId: id, content } });
        setOpen(false);
        onSaved();
      } catch (err) {
        logger.error("Error updating admin note:", err);
      }
    };
    void save();
  }, [updateAdminNote, id, content, setOpen, onSaved]);

  return { open, content, isSaving, openDialog, onContentChange: setContent, onClose, onSave };
}

interface ClassAuditHandlersArgs {
  readonly id: string;
  readonly audit: MaybeAudit;
  readonly router: ReturnType<typeof useRouter>;
  readonly resendNotifications: ReturnType<typeof useMutation>[0];
  readonly t: ClassAuditT;
  readonly adminNote: AdminNoteDialogStateWithOpen;
}

function useClassAuditHandlers({ id, audit, router, resendNotifications, t, adminNote }: ClassAuditHandlersArgs) {
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
