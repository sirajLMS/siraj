import { HistoryOutlined, MailOutlineOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useCallback } from "react";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import type { StudentStatusHeaderProps } from "@/frontend/common/views/dashboard/students/status/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const STATUS_DOT_COLOR_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "success",
  [StudentStatus.Suspended]: "error",
  [StudentStatus.OnLeave]: "warning",
  [StudentStatus.OnTrial]: "info",
  [StudentStatus.Deactivated]: "grey",
};

function getStatusDotColor(student: StudentStatusHeaderProps["student"], theme: Theme) {
  const key = STATUS_DOT_COLOR_MAP[student.status] ?? "warning";
  if (key === "success") return theme.palette.success.main;
  if (key === "error") return theme.palette.error.main;
  if (key === "warning") return theme.palette.warning.main;
  if (key === "info") return theme.palette.info.main;
  if (key === "grey") return theme.palette.outline;
  return theme.palette.onSurfaceVariant;
}

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
      <MobileUserAvatar
        src={student.avatarUrl}
        label={student.name}
        size={96}
        sx={{
          border: `4px solid ${theme.palette.background.paper}`,
          boxShadow: theme.palette.shadow.card,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 24,
          height: 24,
          borderRadius: "full",
          border: `4px solid ${theme.palette.background.paper}`,
          backgroundColor: getStatusDotColor(student, theme),
        }}
      />
    </Box>
  );
}

function StudentInfo({ student }: Readonly<{ student: StudentStatusHeaderProps["student"] }>) {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
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
          <MobileStatusBadge
            category="studentAccount"
            status={getBadgeStatusKey(student.status)}
            label={t.statusOptions[student.status]}
          />
        ) : null}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
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
  const t = useAppTranslation().dashboardTranslations.studentStatus;
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
          fullWidth
          variant="outlined"
          startIcon={<HistoryOutlined />}
          onClick={handleViewHistory}
          sx={theme => ({
            borderRadius: "button",
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            "&:hover": {
              borderColor: theme.palette.primary.dark,
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
            },
          })}
        >
          {t.actions.viewHistory}
        </Button>
      ) : null}
      {showContactParent ? (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MailOutlineOutlined />}
          onClick={handleContactParent}
          sx={theme => ({
            borderRadius: "button",
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            "&:hover": {
              borderColor: theme.palette.primary.dark,
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
            },
          })}
        >
          {t.actions.contactParent}
        </Button>
      ) : null}
    </Box>
  );
}

export function StudentStatusHeaderMobile({ student, embedded = false }: Readonly<StudentStatusHeaderProps>) {
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
