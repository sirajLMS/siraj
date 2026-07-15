"use client";

import { Fingerprint, HistoryOutlined, MailOutlineOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useCallback } from "react";
import { UserAvatar } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { formatStudentDisplayId } from "@/frontend/common/utils/formatStudentDisplayId";
import { profileHrefForUser, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import type { StudentStatusHeaderProps } from "@/frontend/common/views/dashboard/students/status/types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}

function StudentAvatar({
  student,
  showAvatar,
}: Readonly<{ student: StudentStatusHeaderProps["student"]; showAvatar: boolean }>) {
  const theme = useTheme();
  if (!showAvatar) {
    return null;
  }

  return (
    <Box sx={{ position: "relative" }}>
      <UserAvatar
        src={student.avatarUrl}
        label={student.name}
        size={96}
        sx={{
          border: `4px solid ${theme.palette.background.paper}`,
          boxShadow: theme.palette.shadow.card,
        }}
      />
    </Box>
  );
}

function StudentInfo({ student }: Readonly<{ student: StudentStatusHeaderProps["student"] }>) {
  const t = useAppTranslation("dashboard.studentStatus");
  const { showField, canView } = useStudentFieldAccess();
  const showIdentity = showField(student.name, "student_identity");
  const showTeacher = showField(student.teacherName, "student_teacher");
  const showStatus = canView("student_academic");

  if (!showIdentity && !showTeacher && !showStatus) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 1.5 }}>
        {showIdentity ? (
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {student.name}
          </Typography>
        ) : null}
        {showStatus ? (
          <StatusBadge
            category="studentAccount"
            status={getBadgeStatusKey(student.status)}
            label={t.statusOptions[student.status]}
          />
        ) : null}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
        {showIdentity ? (
          <Box
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "center", md: "flex-start" },
              gap: 1,
              color: theme.palette.onSurfaceVariant,
            })}
          >
            <Fingerprint sx={{ fontSize: 16 }} />
            <Typography variant="labelMd" sx={{ letterSpacing: "0.05em" }}>
              {t.studentId(formatStudentDisplayId(student.id))}
            </Typography>
          </Box>
        ) : null}
        {showTeacher ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {student.teacherName}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function HeaderActions({ student }: Readonly<{ student: StudentStatusHeaderProps["student"] }>) {
  const t = useAppTranslation("dashboard.studentStatus");
  const router = useRouter();
  const { canView } = useStudentFieldAccess();

  const showHistory = canView("student_history");
  const showContactParent = canView("student_parent") && Boolean(student.parentUserId);

  const handleViewHistory = useCallback(() => {
    router.push(studentProfileTabHref(student.id, "history"));
  }, [router, student.id]);

  const handleContactParent = useCallback(() => {
    if (!student.parentUserId) {
      return;
    }
    router.push(profileHrefForUser(student.parentUserId));
  }, [router, student.parentUserId]);

  if (!showHistory && !showContactParent) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", md: "auto" } }}>
      {showHistory ? (
        <Button
          variant="outlined"
          startIcon={<HistoryOutlined />}
          onClick={handleViewHistory}
          sx={theme => ({
            borderRadius: "button",
            color: theme.palette.secondary.main,
            borderColor: theme.palette.border.main,
            "&:hover": {
              borderColor: theme.palette.secondary.main,
              backgroundColor: theme.palette.surfaceContainerHigh,
            },
          })}
        >
          {t.actions.viewHistory}
        </Button>
      ) : null}
      {showContactParent ? (
        <Button
          variant="outlined"
          startIcon={<MailOutlineOutlined />}
          onClick={handleContactParent}
          sx={theme => ({
            borderRadius: "button",
            color: theme.palette.secondary.main,
            borderColor: theme.palette.border.main,
            "&:hover": {
              borderColor: theme.palette.secondary.main,
              backgroundColor: theme.palette.surfaceContainerHigh,
            },
          })}
        >
          {t.actions.contactParent}
        </Button>
      ) : null}
    </Box>
  );
}

export function StudentStatusHeaderDesktop({ student, embedded = false }: Readonly<StudentStatusHeaderProps>) {
  const { showField } = useStudentFieldAccess();
  const showAvatar = showField(student.avatarUrl ?? student.name, "student_identity");

  if (embedded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <HeaderActions student={student} />
      </Box>
    );
  }

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: { xs: 3, md: "cardPadding" },
        mb: { xs: 3, md: 4 },
        border: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "center", md: "center" },
        justifyContent: "space-between",
        textAlign: { xs: "center", md: "left" },
        gap: 3,
      })}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 3 }}>
        <StudentAvatar student={student} showAvatar={showAvatar} />
        <StudentInfo student={student} />
      </Box>
      <HeaderActions student={student} />
    </Box>
  );
}
