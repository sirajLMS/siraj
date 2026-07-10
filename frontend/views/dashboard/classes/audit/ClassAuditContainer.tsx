"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { ClassAuditView } from "@/frontend/views/dashboard/classes/audit/ClassAuditView";
import { useRouter } from "@/shared/i18n/routing";

function exportToCsv(
  students: readonly {
    readonly name?: string | null;
    readonly studentId?: string | null;
    readonly attendanceStatus?: string | null;
  }[],
  filename: string,
  id: string
) {
  try {
    const filtered = students.filter((s): s is NonNullable<typeof s> => s != null);
    const csvRows = [
      [t("students.studentName"), t("students.idNumber"), t("students.attendanceStatus")].join(","),
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

function useAuditLabels(
  t: ReturnType<typeof useTranslations<"dashboard.classAudit">>,
  audit: {
    readonly registeredStudentCount?: number | null;
    readonly adminNote?: { readonly lastUpdated?: string | null; readonly content?: string | null } | null;
  } | null
) {
  return {
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
      title: t("students.title", { count: audit?.registeredStudentCount ?? 0 }),
      exportList: t("students.exportList"),
      studentName: t("students.studentName"),
      idNumber: t("students.idNumber"),
      attendanceStatus: t("students.attendanceStatus"),
      actions: t("students.actions"),
      student: t("students.student"),
      status: t("students.status"),
      viewAll: t("students.viewAll", { count: audit?.registeredStudentCount ?? 0 }),
      pending: t("students.pending"),
      present: t("students.present"),
      absent: t("students.absent"),
      noEntries: t("students.noEntries"),
    },
    meetingInfo: {
      title: t("venue.title"),
      joinMeeting: t("venue.viewMap"),
      capacityBadge: t("venue.capacityBadge", { count: 0 }),
      capacity: t("venue.capacity", { count: 0 }),
      meetingIdLabel: t("meetingIdLabel"),
      online: t("online"),
      meetingIdNA: t("meetingIdNA"),
    },
    communicationLog: {
      title: t("communication.title"),
      resendNotifications: t("communication.resendNotifications"),
    },
    adminNote: {
      title: t("adminNote.title"),
      titleMobile: t("adminNote.titleMobile"),
      lastUpdated: t("adminNote.lastUpdated", { time: audit?.adminNote?.lastUpdated ?? "" }),
      update: t("adminNote.update"),
      edit: t("adminNote.edit"),
    },
  };
}

function AdminNoteDialog({
  open,
  onClose,
  noteContent,
  onNoteContentChange,
  onSave,
  isUpdatingNote,
  title,
  editLabel,
  updateLabel,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly noteContent: string;
  readonly onNoteContentChange: (value: string) => void;
  readonly onSave: () => void;
  readonly isUpdatingNote: boolean;
  readonly title: string;
  readonly editLabel: string;
  readonly updateLabel: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          multiline
          rows={4}
          fullWidth
          value={noteContent}
          onChange={e => onNoteContentChange(e.target.value)}
          disabled={isUpdatingNote}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{editLabel}</Button>
        <Button onClick={onSave} variant="contained" disabled={isUpdatingNote}>
          {updateLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ClassAuditContainer() {
  const router = useRouter();
  const t = useTranslations("dashboard.classAudit");
  const tc = useTranslations("common");
  const client = useApolloClient();

  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  const { data, loading, error } = useQuery(groupClassAuditQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id,
  });

  const [updateAdminNote, { loading: isUpdatingNote }] = useMutation(updateClassAdminNoteMutationDocument, {
    onCompleted: () => {
      setNoteDialogOpen(false);
      client.refetchQueries({ include: [groupClassAuditQueryDocument] });
    },
  });

  const [resendNotifications, { loading: isResending }] = useMutation(resendClassNotificationsMutationDocument, {
    onCompleted: () => {
      client.refetchQueries({ include: [groupClassAuditQueryDocument] });
    },
  });

  // Call the hook at the top level to avoid conditional hook violation
  const audit = data?.groupClassAudit;
  const labels = useAuditLabels(t, audit ?? null);

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!id) {
    return <Box sx={{ p: 3, textAlign: "center" }}>{t("invalidClassId")}</Box>;
  }

  if (error || !audit) {
    logger.error("Error fetching class audit:", error);
    return <Alert severity="error">{tc("loadFailed")}</Alert>;
  }

  const handleGenerateReport = () => {
    exportToCsv(audit?.students ?? [], "class-audit", id);
  };

  const handleEditClass = () => {
    router.push(`/reschedule?classInstanceId=${id}`);
  };

  const handleExportStudents = () => {
    exportToCsv(audit?.students ?? [], "students", id);
  };

  const handleViewStudent = (studentId: string) => {
    router.push(`/students/${studentId}/status`);
  };

  const handleResendNotifications = () => {
    resendNotifications({ variables: { classInstanceId: id } });
  };

  const handleOpenNoteDialog = () => {
    setNoteContent(audit?.adminNote?.content ?? "");
    setNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    updateAdminNote({ variables: { classInstanceId: id, content: noteContent } });
  };

  return (
    <>
      <ClassAuditView
        audit={audit}
        labels={labels}
        onGenerateReport={handleGenerateReport}
        onEditClass={handleEditClass}
        onExportStudents={handleExportStudents}
        onViewStudent={handleViewStudent}
        onResendNotifications={handleResendNotifications}
        onUpdateAdminNote={handleOpenNoteDialog}
        onEditAdminNote={handleOpenNoteDialog}
        isResending={isResending}
      />
      <AdminNoteDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        noteContent={noteContent}
        onNoteContentChange={setNoteContent}
        onSave={handleSaveNote}
        isUpdatingNote={isUpdatingNote}
        title={t("adminNote.title")}
        editLabel={t("adminNote.edit")}
        updateLabel={t("adminNote.update")}
      />
    </>
  );
}
