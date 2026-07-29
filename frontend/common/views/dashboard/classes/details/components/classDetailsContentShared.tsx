"use client";

import { ClassDetailsAdminView } from "@/frontend/common/views/dashboard/classes/details/admin/ClassDetailsAdminView";
import { ActionFeedbackAlert } from "@/frontend/common/views/dashboard/classes/details/components/ActionFeedbackAlert";
import { DeleteConfirmationDialog } from "@/frontend/common/views/dashboard/classes/details/components/DeleteConfirmationDialog";
import type { ClassDetailsContentSharedProps } from "@/frontend/common/views/dashboard/classes/details/components/types/classDetailsContentShared.types";
import { useLocalizedClassInstance } from "@/frontend/common/views/dashboard/classes/details/hooks/useLocalizedClassInstance";
import { ClassDetailsStudentView } from "@/frontend/common/views/dashboard/classes/details/student/ClassDetailsStudentView";
import { ClassDetailsTeacherView } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassDetailsTeacherView";
import type { AdminViewProps, StudentViewProps, TeacherViewProps } from "@/frontend/common/views/dashboard/classes/details/types";
import {
  useAdminViewLabels,
  useStudentViewLabels,
  useTeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";

const AdminView = (props: AdminViewProps) => {
  const labels = useAdminViewLabels(props.instance.studentTimezone ?? "");
  const instance = useLocalizedClassInstance(props.instance);
  return <ClassDetailsAdminView {...props} instance={instance} labels={labels} />;
};

const TeacherView = (props: TeacherViewProps) => {
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
    onCloseDeleteDialog,
    onConfirmDelete,
    t,
    headerLabels,
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
  } = props;
  const { Header } = slots;

  const viewContent = (() => {
    if (canOverride) {
      return (
        <AdminView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={onDismissWarning}
          onForceActivate={handlers.handleForceActivate}
          onStop={handlers.handleStop}
          onGenerateLog={() => {}}
          onReschedule={handlers.handleReschedule}
          onDelete={() => {}}
          handlers={handlers}
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
          onDelete={() => {}}
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
          onDelete={() => {}}
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
      <Header
        instance={instance}
        canOverride={canOverride}
        isStudentView={isStudentView}
        labels={headerLabels}
      />
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
