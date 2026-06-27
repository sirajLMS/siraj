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
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  groupClassAuditQueryDocument,
  resendClassNotificationsMutationDocument,
  updateClassAdminNoteMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { ClassAuditView } from "./ClassAuditView";

export function ClassAuditContainer() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.classAudit");
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!id) {
    return <Box sx={{ p: 3, textAlign: "center" }}>Invalid Class ID</Box>;
  }

  if (error || !data?.groupClassAudit) {
    logger.error("Error fetching class audit:", error);
    return <Alert severity="error">{error?.message ?? "Failed to load class audit data"}</Alert>;
  }

  const audit = data.groupClassAudit;
  if (!audit) return null;

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

  const handleGenerateReport = () => {
    try {
      const students = (audit?.students ?? []).filter((s): s is NonNullable<typeof s> => s != null);
      const csvRows = [
        ["Name", "Student ID", "Attendance Status"].join(","),
        ...students.map(s => [s.name ?? "", s.studentId ?? "", s.attendanceStatus ?? ""].join(",")),
      ];
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `class-audit-${id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error("Error generating report:", err);
    }
  };

  const handleEditClass = () => {
    router.push(`/${locale}/reschedule?classInstanceId=${id}`);
  };

  const handleExportStudents = () => {
    try {
      const students = (audit?.students ?? []).filter((s): s is NonNullable<typeof s> => s != null);
      const csvRows = [
        ["Name", "Student ID", "Attendance Status"].join(","),
        ...students.map(s => [s.name ?? "", s.studentId ?? "", s.attendanceStatus ?? ""].join(",")),
      ];
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `students-${id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error("Error exporting students:", err);
    }
  };

  const handleViewStudent = (studentId: string) => {
    router.push(`/${locale}/students/${studentId}/status`);
  };

  const handleJoinMeeting = () => {
    const url = audit?.meetingInfo?.zoomMeetingUrl ?? audit?.meetingInfo?.joinUrl;
    if (url) {
      window.open(url, "_blank");
    }
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

  const noteDialog = (
    <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t("adminNote.title")}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          multiline
          rows={4}
          fullWidth
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          disabled={isUpdatingNote}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setNoteDialogOpen(false)}>{t("adminNote.edit")}</Button>
        <Button onClick={handleSaveNote} variant="contained" disabled={isUpdatingNote}>
          {t("adminNote.update")}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <ClassAuditView
        audit={audit}
        labels={labels}
        onGenerateReport={handleGenerateReport}
        onEditClass={handleEditClass}
        onExportStudents={handleExportStudents}
        onViewStudent={handleViewStudent}
        onJoinMeeting={handleJoinMeeting}
        onResendNotifications={handleResendNotifications}
        onUpdateAdminNote={handleOpenNoteDialog}
        onEditAdminNote={handleOpenNoteDialog}
        isResending={isResending}
      />
      {noteDialog}
    </>
  );
}
