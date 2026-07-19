"use client";

import { ClassDetailsAdminView } from "@/frontend/common/views/dashboard/classes/details/admin/ClassDetailsAdminView";
import { ActionFeedbackAlert } from "@/frontend/common/views/dashboard/classes/details/components/ActionFeedbackAlert";
import { DeleteConfirmationDialog } from "@/frontend/common/views/dashboard/classes/details/components/DeleteConfirmationDialog";
import { useLocalizedClassInstance } from "@/frontend/common/views/dashboard/classes/details/hooks/useLocalizedClassInstance";
import { ClassDetailsTeacherView } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassDetailsTeacherView";
import type {
  AdminViewProps,
  ClassDetailsContentProps,
  TeacherViewProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import {
  useAdminViewLabels,
  useTeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";
import { ClassDetailsHeaderMobile } from "@/frontend/mobile/views/dashboard/classes/details/components/classDetailsHeader.mobile";

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

export function ClassDetailsContentMobile(props: Readonly<ClassDetailsContentProps>) {
  const {
    instance,
    canOverride,
    isParentView,
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
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
  } = props;

  return (
    <>
      <ClassDetailsHeaderMobile instance={instance} canOverride={canOverride} />
      <ActionFeedbackAlert feedbackState={feedbackState} />
      {canOverride ? (
        <AdminView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={onDismissWarning}
          onForceActivate={handlers.handleForceActivate}
          onStop={handlers.handleStop}
          onGenerateLog={() => {}}
          onReschedule={handlers.handleReschedule}
          onDelete={() => {}}
          formattedScheduledDate={formattedScheduledDate}
          formattedStartTime={formattedStartTime}
          formattedEndTime={formattedEndTime}
          {...sessionActionProps}
        />
      ) : canViewSessionDetails ? (
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
      ) : null}
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
