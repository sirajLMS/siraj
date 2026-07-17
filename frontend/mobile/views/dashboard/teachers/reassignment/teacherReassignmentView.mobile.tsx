"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Stack } from "@mui/material";
import { PageContainer } from "@/frontend/common/components/ui";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { MobileContentStack, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { CurrentTeacherCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/currentTeacherCard.mobile";
import { ManagementControlsCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/managementControlsCard.mobile";
import { ReassignmentBentoGridMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/reassignmentBentoGrid.mobile";
import { StudentContextCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/studentContextCard.mobile";
import { useAppTranslation } from "@/shared/locale";

export function TeacherReassignmentViewMobile({
  student,
  currentTeacherName,
  teachers,
  isSubmitting,
  onReassign,
  onStatusChange,
  onCancel,
}: Readonly<TeacherReassignmentViewModel>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment;

  return (
    <PageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      <MobileContentStack>
        <Stack spacing={3}>
          <StudentContextCardMobile student={student} />
          <CurrentTeacherCardMobile
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
            {t.warning}
          </Alert>

          <ManagementControlsCardMobile
            teachers={teachers}
            currentStatus={student.status}
            studentId={student.id}
            version={student.version}
            isSubmitting={isSubmitting}
            onReassign={onReassign}
            onStatusChange={onStatusChange}
            onCancel={onCancel}
          />

          <ReassignmentBentoGridMobile
            studentId={student.id}
            lastUpdated={student.updatedAt}
            pendingNotificationCount={0}
          />
        </Box>
      </MobileContentStack>
    </PageContainer>
  );
}
