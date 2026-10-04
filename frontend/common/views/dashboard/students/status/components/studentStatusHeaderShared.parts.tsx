"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Typography, useTheme } from "@mui/material";
import { useCallback } from "react";
import { profileHrefForUser, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  ACTION_BUTTON_SX,
  getBadgeStatusKey,
} from "@/frontend/common/views/dashboard/students/status/components/studentStatusHeaderShared.constants";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import type { StudentStatusHeaderSharedProps } from "@/frontend/common/views/dashboard/students/status/types/studentStatusHeaderShared.types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { useRouter } from "@/shared/i18n/navigation";

export function StudentAvatar({
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

  const avatar = (
    <AvatarComponent
      src={student.avatarUrl}
      label={student.name}
      size={96}
      sx={{
        border: `4px solid ${theme.palette.background.paper}`,
        boxShadow: theme.palette.shadow.card,
      }}
    />
  );

  if (!StatusDot) {
    return <Box sx={{ position: "relative" }}>{avatar}</Box>;
  }

  return (
    <Box sx={{ position: "relative" }}>
      {avatar}
      <StatusDot student={student} />
    </Box>
  );
}

export function StudentInfo({
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

export function HeaderActions({
  student,
  buttonFullWidth,
  slots,
}: Readonly<{
  student: StudentStatusPageData;
  buttonFullWidth: boolean;
  slots: StudentStatusHeaderSharedProps["slots"];
}>) {
  const t = useStudentStatusLabels();
  const router = useRouter();
  const { canView } = useStudentFieldAccess();
  const { FilterButton } = slots;

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
        <FilterButton
          fullWidth={buttonFullWidth}
          startIcon={<HistoryOutlined />}
          onClick={handleViewHistory}
          sx={ACTION_BUTTON_SX}
        >
          {t.actions.viewHistory}
        </FilterButton>
      ) : null}
      {showContactParent ? (
        <FilterButton
          fullWidth={buttonFullWidth}
          startIcon={<MailOutlined />}
          onClick={handleContactParent}
          sx={ACTION_BUTTON_SX}
        >
          {t.actions.contactParent}
        </FilterButton>
      ) : null}
    </Box>
  );
}
