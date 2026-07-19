"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Stack } from "@mui/material";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { CurrentTeacherCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/currentTeacherCard.mobile";
import { ManagementControlsCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/managementControlsCard.mobile";
import { ReassignmentBentoGridMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/reassignmentBentoGrid.mobile";
import { StudentContextCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/studentContextCard.mobile";
import { useAppTranslation } from "@/shared/locale";

export function TeacherReassignmentViewMobile({
  student,
  currentTeacherName,
  isSubmitting,
  onReassign,
  onStatusChange,
  onCancel,
  controls,
  bento,
}: Readonly<TeacherReassignmentViewModel>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment;

  return (
    <MobilePageContainer>
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
            currentStatus={student.status}
            studentId={student.id}
            version={student.version}
            isSubmitting={isSubmitting}
            onReassign={onReassign}
            onStatusChange={onStatusChange}
            onCancel={onCancel}
            selectedTeacherId={controls.selectedTeacherId}
            selectedNewStatus={controls.selectedNewStatus}
            saved={controls.saved}
            onSelectedTeacherIdChange={controls.onSelectedTeacherIdChange}
            onSelectedNewStatusChange={controls.onSelectedNewStatusChange}
            onSubmitForm={controls.onSubmitForm}
          />

          <ReassignmentBentoGridMobile
            studentId={student.id}
            lastUpdated={student.updatedAt}
            pendingNotificationCount={0}
            onOpenChangeHistory={bento.onOpenChangeHistory}
            onOpenParentContact={bento.onOpenParentContact}
          />
        </Box>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
