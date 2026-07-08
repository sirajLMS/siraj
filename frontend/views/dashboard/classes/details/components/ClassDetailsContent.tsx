"use client";

import type { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { ClassDetailsAdminView } from "../admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "../ClassDetailsHeader";
import type { useClassActionHandlers } from "../hooks/useClassActionHandlers";
import { ClassDetailsTeacherView } from "../teacher/ClassDetailsTeacherView";
import type { ActionFeedbackState, AdminViewProps, TeacherViewProps } from "../types";
import { useAdminViewLabels, useTeacherViewLabels } from "../useClassDetailsLabels";
import { ActionFeedbackAlert } from "./ActionFeedbackAlert";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

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

export function ClassDetailsContent({
  instance,
  canOverride,
  isParentView,
  isMobile,
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
  readonly isMobile: boolean;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly handlers: ReturnType<typeof useClassActionHandlers>;
  readonly sessionActionProps: SessionActionProps;
  readonly feedbackState: ActionFeedbackState | null;
  readonly deleteDialogOpen: boolean;
  readonly onCloseDeleteDialog: () => void;
  readonly onConfirmDelete: () => Promise<void>;
  readonly t: ReturnType<typeof useTranslations<"dashboard.classDetails">>;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
}) {
  return (
    <>
      <ClassDetailsHeader instance={instance} canOverride={canOverride} isMobile={isMobile} />
      <ActionFeedbackAlert feedbackState={feedbackState} />
      {canOverride ? (
        <AdminView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={onDismissWarning}
          onForceActivate={handlers.handleForceActivate}
          onStop={handlers.handleStop}
          onGenerateLog={() => {}} // Will be overridden by parent
          onReschedule={handlers.handleReschedule}
          onDelete={() => {}} // Will be overridden by parent
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
            onDelete={() => {}} // Will be overridden by parent
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
        title={t("deleteConfirm.title")}
        message={t("deleteConfirm.message")}
        cancelLabel={t("deleteConfirm.cancel")}
        confirmLabel={t("deleteConfirm.confirm")}
      />
    </>
  );
}
