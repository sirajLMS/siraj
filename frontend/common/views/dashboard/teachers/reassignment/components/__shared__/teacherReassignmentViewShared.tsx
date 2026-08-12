"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert } from "@mui/material";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { TeacherReassignmentViewSharedProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/teacherReassignmentViewShared.types";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";

function buildManagementControlsProps(
  vm: Readonly<TeacherReassignmentViewModel>,
  statusLabelId: string
): ManagementControlsCardProps {
  return {
    currentStatus: vm.student.status,
    studentId: vm.student.id,
    version: vm.student.version,
    isSubmitting: vm.isSubmitting,
    onReassign: vm.onReassign,
    onStatusChange: vm.onStatusChange,
    onCancel: vm.onCancel,
    selectedTeacherId: vm.controls.selectedTeacherId,
    selectedNewStatus: vm.controls.selectedNewStatus,
    saved: vm.controls.saved,
    onSelectedTeacherIdChange: vm.controls.onSelectedTeacherIdChange,
    onSelectedNewStatusChange: vm.controls.onSelectedNewStatusChange,
    onSubmitForm: vm.controls.onSubmitForm,
    labels: {
      controls: vm.labels.controls,
      actions: vm.labels.actions,
    },
    statusLabelId,
  };
}

function buildBentoGridProps(vm: Readonly<TeacherReassignmentViewModel>): {
  studentId: string;
  lastUpdated: string | null;
  pendingNotificationCount: number;
  onOpenChangeHistory: () => void;
  onOpenParentContact: () => void;
  labels: TeacherReassignmentViewModel["labels"]["historyAndContact"];
} {
  return {
    studentId: vm.student.id,
    lastUpdated: vm.student.updatedAt,
    pendingNotificationCount: 0,
    onOpenChangeHistory: vm.bento.onOpenChangeHistory,
    onOpenParentContact: vm.bento.onOpenParentContact,
    labels: vm.labels.historyAndContact,
  };
}

export function TeacherReassignmentViewShared({ viewModel, slots }: Readonly<TeacherReassignmentViewSharedProps>) {
  const {
    PageContainer,
    PageHeader,
    ContentLayout,
    LeftPanel,
    RightPanel,
    StudentContextCard,
    CurrentTeacherCard,
    ManagementControlsCard,
    ReassignmentBentoGrid,
    statusLabelIdSuffix,
    breadcrumbs,
  } = slots;

  const statusLabelId = `teacher-reassignment-status-label-${statusLabelIdSuffix}`;

  const managementControlsProps = buildManagementControlsProps(viewModel, statusLabelId);
  const bentoGridProps = buildBentoGridProps(viewModel);

  return (
    <PageContainer>
      <PageHeader
        title={viewModel.labels.pageTitle}
        subtitle={viewModel.labels.pageSubtitle}
        breadcrumbs={breadcrumbs}
      />

      <ContentLayout>
        <LeftPanel>
          <StudentContextCard student={viewModel.student} labels={viewModel.labels.studentContext} />
          <CurrentTeacherCard
            currentTeacherName={viewModel.currentTeacherName}
            teacherId={viewModel.student.primaryTeacherId ?? undefined}
            labels={viewModel.labels.currentTeacher}
          />
        </LeftPanel>

        <RightPanel>
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
            {viewModel.labels.warning}
          </Alert>

          <ManagementControlsCard {...managementControlsProps} />

          <ReassignmentBentoGrid {...bentoGridProps} />
        </RightPanel>
      </ContentLayout>
    </PageContainer>
  );
}
