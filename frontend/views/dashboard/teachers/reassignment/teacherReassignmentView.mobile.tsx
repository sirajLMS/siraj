"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { MobileContentStack, MobilePageHeader, PageContainer } from "@/frontend/common/components/ui";
import { CurrentTeacherCard } from "@/frontend/views/dashboard/teachers/reassignment/components/CurrentTeacherCard";
import { ManagementControlsCard } from "@/frontend/views/dashboard/teachers/reassignment/components/ManagementControlsCard";
import { ReassignmentBentoGrid } from "@/frontend/views/dashboard/teachers/reassignment/components/ReassignmentBentoGrid";
import { StudentContextCard } from "@/frontend/views/dashboard/teachers/reassignment/components/StudentContextCard";
import type { TeacherReassignmentViewModel } from "@/frontend/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";

export function TeacherReassignmentViewMobile({
  student,
  currentTeacherName,
  teachers,
  isSubmitting,
  onReassign,
  onStatusChange,
  onCancel,
}: Readonly<TeacherReassignmentViewModel>) {
  const t = useTranslations("dashboard.teacherReassignment");

  return (
    <PageContainer>
      <MobilePageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <MobileContentStack>
        <Stack spacing={3}>
          <StudentContextCard student={student} />
          <CurrentTeacherCard
            currentTeacherName={currentTeacherName}
            teacherId={student.primaryTeacherId ?? undefined}
          />
        </Stack>

        <Box>
          <Alert
            severity="error"
            icon={<WarningOutlined />}
            sx={theme => ({
              backgroundColor: theme.palette.errorContainer,
              color: theme.palette.onErrorContainer,
              borderRadius: 2,
              "& .MuiAlert-icon": {
                color: theme.palette.error.main,
              },
              fontWeight: 700,
            })}
          >
            {t("warning")}
          </Alert>

          <ManagementControlsCard
            teachers={teachers}
            currentStatus={student.status}
            studentId={student.id}
            version={student.version}
            isSubmitting={isSubmitting}
            onReassign={onReassign}
            onStatusChange={onStatusChange}
            onCancel={onCancel}
          />

          <ReassignmentBentoGrid studentId={student.id} lastUpdated={student.updatedAt} pendingNotificationCount={0} />
        </Box>
      </MobileContentStack>
    </PageContainer>
  );
}
