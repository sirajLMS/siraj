"use client";

import { ClassDetailsAdminView } from "@/frontend/common/views/dashboard/classes/details/admin/ClassDetailsAdminView";
import { ActionFeedbackAlert } from "@/frontend/common/views/dashboard/classes/details/components/ActionFeedbackAlert";
import { DeleteConfirmationDialog } from "@/frontend/common/views/dashboard/classes/details/components/DeleteConfirmationDialog";
import type { ClassDetailsContentSharedProps } from "@/frontend/common/views/dashboard/classes/details/components/types/classDetailsContentShared.types";
import { useLocalizedClassInstance } from "@/frontend/common/views/dashboard/classes/details/hooks/useLocalizedClassInstance";
import { ClassDetailsStudentView } from "@/frontend/common/views/dashboard/classes/details/student/ClassDetailsStudentView";
import { ClassDetailsTeacherView } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassDetailsTeacherView";
import type {
  AdminViewProps,
  ClassDetailsMetricGridSlot,
  StudentViewProps,
  TeacherViewProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import {
  useAdminViewLabels,
  useStudentViewLabels,
  useTeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";

interface AdminViewWrapperProps extends AdminViewProps {
  readonly livePerformanceMetricGrid: ClassDetailsMetricGridSlot;
}

const AdminView = (props: AdminViewWrapperProps) => {
  const labels = useAdminViewLabels(props.instance.studentTimezone ?? "");
  const instance = useLocalizedClassInstance(props.instance);
  return <ClassDetailsAdminView {...props} instance={instance} labels={labels} />;
};

interface TeacherViewWrapperProps extends TeacherViewProps {
  readonly performanceMetricGrid: ClassDetailsMetricGridSlot;
}

const TeacherView = (props: TeacherViewWrapperProps) => {
  const labels = useTeacherViewLabels(props.instance.studentTimezone ?? "");
  const instance = useLocalizedClassInstance(props.instance);
  return <ClassDetailsTeacherView {...props} instance={instance} labels={labels} />;
};

const StudentView = (props: StudentViewProps) => {
  const labels = useStudentViewLabels(props.instance.studentTimezone ?? "");
  const instance = useLocalizedClassInstance(props.instance);
  return <ClassDetailsStudentView {...props} instance={instance} labels={labels} />;
};

export function ClassDetailsContentShared({ props, slots }: Readonly<ClassDetailsContentSharedProps>) {
  const {
    instance,
    canOverride,
    isParentView,
    isStudentView,
    canViewSessionDetails,
    isWarningDismissed,
    onDismissWarning,
    handlers,
    sessionActionProps,
    feedbackState,
    deleteDialogOpen,
    onOpenDeleteDialog,
    onCloseDeleteDialog,
    onConfirmDelete,
    onGenerateLog,
    overrideRateDialog,
    t,
    headerLabels,
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
  } = props;
  const { Header, TeacherPerformanceMetricGrid, LivePerformanceMetricGrid } = slots;

  const viewContent = (() => {
    if (canOverride) {
      return (
        <AdminView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={onDismissWarning}
          onForceActivate={handlers.handleForceActivate}
          onStop={handlers.handleStop}
          onGenerateLog={onGenerateLog}
          onReschedule={handlers.handleReschedule}
          onDelete={onOpenDeleteDialog}
          handlers={handlers}
          overrideRateDialog={overrideRateDialog}
          livePerformanceMetricGrid={LivePerformanceMetricGrid}
          formattedScheduledDate={formattedScheduledDate}
          formattedStartTime={formattedStartTime}
          formattedEndTime={formattedEndTime}
          {...sessionActionProps}
        />
      );
    }
    if (isStudentView) {
      return (
        <StudentView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={onDismissWarning}
          onStop={handlers.handleStop}
          onDelete={onOpenDeleteDialog}
          formattedScheduledDate={formattedScheduledDate}
          formattedStartTime={formattedStartTime}
          formattedEndTime={formattedEndTime}
          {...sessionActionProps}
        />
      );
    }
    if (canViewSessionDetails) {
      return (
        <TeacherView
          instance={instance}
          viewMode={isParentView ? "parent" : "teacher"}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={onDismissWarning}
          onActivate={handlers.handleActivate}
          onStop={handlers.handleStop}
          onInfoEdit={handlers.handleInfoEdit}
          onDelete={onOpenDeleteDialog}
          performanceMetricGrid={TeacherPerformanceMetricGrid}
          formattedScheduledDate={formattedScheduledDate}
          formattedStartTime={formattedStartTime}
          formattedEndTime={formattedEndTime}
          {...sessionActionProps}
        />
      );
    }
    return null;
  })();

  return (
    <>
      <Header instance={instance} canOverride={canOverride} isStudentView={isStudentView} labels={headerLabels} />
      <ActionFeedbackAlert feedbackState={feedbackState} />
      {viewContent}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={onCloseDeleteDialog}
        onConfirm={onConfirmDelete}
        title={t.deleteConfirm.title}
        message={t.deleteConfirm.message}
        cancelLabel={t.deleteConfirm.cancel}
        confirmLabel={t.deleteConfirm.confirm}
      />
    </>
  );
}
