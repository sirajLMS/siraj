"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ClassDetailsAdminView } from "@/frontend/common/views/dashboard/classes/details/admin/ClassDetailsAdminView";
import { ActionFeedbackAlert } from "@/frontend/common/views/dashboard/classes/details/components/ActionFeedbackAlert";
import { DeleteConfirmationDialog } from "@/frontend/common/views/dashboard/classes/details/components/DeleteConfirmationDialog";
import type { useClassActionHandlers } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassActionHandlers";
import { ClassDetailsTeacherView } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassDetailsTeacherView";
import type {
  ActionFeedbackState,
  AdminViewProps,
  TeacherViewProps,
} from "@/frontend/common/views/dashboard/classes/details/types";
import {
  useAdminViewLabels,
  useTeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";
import { ClassDetailsHeaderDesktop } from "@/frontend/desktop/views/dashboard/classes/details/components/classDetailsHeader.desktop";
import type { ClassDetailsLabels } from "@/shared/locale";

const AdminView = (props: AdminViewProps) => {
  const labels = useAdminViewLabels(props.instance.studentTimezone ?? "");
  return <ClassDetailsAdminView {...props} labels={labels} />;
};

const TeacherView = (props: TeacherViewProps) => {
  const labels = useTeacherViewLabels(props.instance.studentTimezone ?? "");
  return <ClassDetailsTeacherView {...props} labels={labels} />;
};

interface SessionActionProps {
  readonly onStart: () => Promise<void>;
  readonly onAbsent: () => Promise<void>;
  readonly onLeave: (reason: string) => Promise<void>;
  readonly onReset: () => Promise<void>;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: null;
}

export function ClassDetailsContentDesktop({
  instance,
  canOverride,
  isParentView,
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
}: {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
  readonly isParentView: boolean;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly handlers: ReturnType<typeof useClassActionHandlers>;
  readonly sessionActionProps: SessionActionProps;
  readonly feedbackState: ActionFeedbackState | null;
  readonly deleteDialogOpen: boolean;
  readonly onCloseDeleteDialog: () => void;
  readonly onConfirmDelete: () => Promise<void>;
  readonly t: ClassDetailsLabels;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
}) {
  return (
    <>
      <ClassDetailsHeaderDesktop instance={instance} canOverride={canOverride} />
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
      ) : (
        <RequirePermission permissions={AppPermission.SessionViewDetails}>
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
        </RequirePermission>
      )}
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
