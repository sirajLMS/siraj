"use client";

import { HistoryOutlined, MailOutlineOutlined } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useCallback } from "react";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForUser, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import type { StudentStatusHeaderSharedProps } from "@/frontend/common/views/dashboard/students/status/types/studentStatusHeaderShared.types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { useRouter } from "@/shared/i18n/navigation";

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
  slots,
}: Readonly<{
  student: StudentStatusPageData;
  showAvatar: boolean;
  slots: StudentStatusHeaderSharedProps["slots"];
}>) {
  const theme = useTheme();
  const { AvatarComponent, StatusDot } = slots;
  if (!showAvatar) {
    return null;
  }

  if (!StatusDot) {
    return (
      <Box sx={{ position: "relative" }}>
        <AvatarComponent
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

  return (
    <Box sx={{ position: "relative" }}>
      <AvatarComponent
        src={student.avatarUrl}
        label={student.name}
        size={96}
        sx={{
          border: `4px solid ${theme.palette.background.paper}`,
          boxShadow: theme.palette.shadow.card,
        }}
      />
      <StatusDot student={student} />
    </Box>
  );
}

function StudentInfo({
  student,
  slots,
}: Readonly<{
  student: StudentStatusPageData;
  slots: StudentStatusHeaderSharedProps["slots"];
}>) {
  const t = useStudentStatusLabels();
  const { showField, canView } = useStudentFieldAccess();
  const showIdentity = showField(student.name, "student_identity");
  const showTeacher = showField(student.teacherName, "student_teacher");
  const showStatus = canView("student_academic");
  const { StatusBadgeComponent } = slots;

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
          <StatusBadgeComponent
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

function HeaderActions({
  student,
  buttonFullWidth,
}: Readonly<{ student: StudentStatusPageData; buttonFullWidth: boolean }>) {
  const t = useStudentStatusLabels();
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
          fullWidth={buttonFullWidth}
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
          fullWidth={buttonFullWidth}
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

export function StudentStatusHeaderShared({ student, embedded, slots }: Readonly<StudentStatusHeaderSharedProps>) {
  const { showField } = useStudentFieldAccess();
  const showAvatar = showField(student.avatarUrl ?? student.name, "student_identity");

  if (embedded) {
    if (slots.embeddedInnerWrapperSx) {
      return (
        <Box sx={slots.embeddedWrapperSx}>
          <Box sx={slots.embeddedInnerWrapperSx}>
            <HeaderActions student={student} buttonFullWidth={slots.buttonFullWidth} />
          </Box>
        </Box>
      );
    }
    return (
      <Box sx={slots.embeddedWrapperSx}>
        <HeaderActions student={student} buttonFullWidth={slots.buttonFullWidth} />
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
        <StudentAvatar student={student} showAvatar={showAvatar} slots={slots} />
        <StudentInfo student={student} slots={slots} />
      </Box>
      <HeaderActions student={student} buttonFullWidth={slots.buttonFullWidth} />
    </Box>
  );
}
