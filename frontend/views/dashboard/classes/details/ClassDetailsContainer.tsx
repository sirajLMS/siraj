"use client";

import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ClassInstanceDetailReturnType as ClassInstanceDetail } from "@/backend/types/class-instance-detail.types";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { classInstanceQueryDocument, classStatusEventsQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { formatScheduleTimeOnly } from "@/frontend/views/dashboard/dashboard/utils/formatScheduleTime";
import { useRouter } from "@/shared/i18n/routing";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "./ClassDetailsHeader";
import { useClassMutations } from "./hooks/useClassMutations";
import { ClassDetailsTeacherView } from "./teacher/ClassDetailsTeacherView";
import { type ClassDetailsViewMode, formatClassDetailDate } from "./types";
import { useAdminViewLabels, useTeacherViewLabels } from "./useClassDetailsLabels";

interface CommonViewProps {
  readonly instance: ClassInstanceDetail;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onStop: () => void;
  readonly onDelete: () => void;
  readonly onStart: () => void;
  readonly onAbsent: () => void;
  readonly onLeave: (reason: string) => void;
  readonly onReset: () => void;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: string | null;
}

interface AdminViewProps extends CommonViewProps {
  readonly onForceActivate: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
}

const AdminView = (props: AdminViewProps) => {
  const labels = useAdminViewLabels(props.instance.studentTimezone ?? "");
  return <ClassDetailsAdminView {...props} labels={labels} />;
};

interface TeacherViewProps extends CommonViewProps {
  readonly viewMode: ClassDetailsViewMode;
  readonly onActivate: () => void;
  readonly onInfoEdit: () => void;
}

const TeacherView = (props: TeacherViewProps) => {
  const labels = useTeacherViewLabels(props.instance.studentTimezone ?? "");
  return <ClassDetailsTeacherView {...props} labels={labels} />;
};

interface ActionFeedbackState {
  readonly message: string;
  readonly severity: "success" | "error";
}

export function ClassDetailsContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.classDetails");

  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";
  const hasPermission = useUserStore(state => state.hasPermission);

  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [feedbackState, setFeedbackState] = useState<ActionFeedbackState | null>(null);
  const [shouldLoadEvents, setShouldLoadEvents] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id },
    skip: !id,
  });

  const { data: eventsData, error: eventsError } = useQuery(classStatusEventsQueryDocument, {
    variables: { classInstanceId: id },
    skip: !id || !shouldLoadEvents,
  });

  useEffect(() => {
    if (shouldLoadEvents && eventsData?.classStatusEvents) {
      try {
        const blob = new Blob([JSON.stringify(eventsData.classStatusEvents, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `class-${id}-events.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setFeedbackState({ message: t("actionFeedback.generateLogSuccess"), severity: "success" });
      } catch (err) {
        logger.error("Error generating log:", err);
        setFeedbackState({ message: t("actionFeedback.generateLogError"), severity: "error" });
      } finally {
        setShouldLoadEvents(false);
      }
    }
  }, [eventsData, shouldLoadEvents, id, t]);

  useEffect(() => {
    if (shouldLoadEvents && eventsError) {
      logger.error("Error fetching class status events:", eventsError);
      setFeedbackState({ message: t("loadError"), severity: "error" });
      setShouldLoadEvents(false);
    }
  }, [eventsError, shouldLoadEvents, t]);

  const {
    forceActivate,
    activate,
    stopClass: stopClassMutation,
    deleteClass: deleteClassMutation,
    startSession: startSessionMutation,
    markAbsent: markAbsentMutation,
    processLeave: processLeaveMutation,
    resetSession: resetSessionMutation,
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
  } = useClassMutations({
    id,
    onError: message => setFeedbackState({ message, severity: "error" }),
  });

  const canOverride = hasPermission(AppPermission.SessionOverrideActions);
  const canActivate = hasPermission(AppPermission.SessionActivateClass);
  const isParentView = hasPermission(AppPermission.ScheduleViewFamily) && !canActivate && !canOverride;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        {" "}
        <CircularProgress sx={theme => ({ color: theme.palette.primary.main })} />
      </Box>
    );
  }

  if (!id) {
    return (
      <Box sx={theme => ({ p: 3, textAlign: "center", color: theme.palette.onSurfaceVariant })}>
        {t("invalidClassId")}
      </Box>
    );
  }

  if (error || !data?.classInstance) {
    logger.error("Error fetching class details:", error);
    return (
      <PageContainer>
        <Alert severity="error">{t("loadError")}</Alert>
      </PageContainer>
    );
  }

  const instance = data.classInstance as ClassInstanceDetail;
  const formattedScheduledDate = formatClassDetailDate(instance.scheduledDate, locale);
  const formattedStartTime = formatScheduleTimeOnly(instance.startTime, locale);
  const formattedEndTime = formatScheduleTimeOnly(instance.endTime, locale);

  const handleForceActivate = async () => {
    try {
      await forceActivate();
      setFeedbackState({ message: t("actionFeedback.forceActivateSuccess"), severity: "success" });
    } catch {
      // Error feedback is handled by useClassMutations onError
    }
  };

  const handleStop = async () => {
    try {
      await stopClassMutation();
      setFeedbackState({ message: t("actionFeedback.stopSuccess"), severity: "success" });
    } catch {
      // Error feedback is handled by useClassMutations onError
    }
  };

  const handleActivate = async () => {
    try {
      await activate();
      setFeedbackState({ message: t("actionFeedback.activateSuccess"), severity: "success" });
    } catch {
      // Error feedback is handled by useClassMutations onError
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteClassMutation();
      router.push("/dashboard");
    } catch {
      setFeedbackState({ message: t("actionFeedback.deleteError"), severity: "error" });
    }
  };

  const handleDeleteRequest = () => {
    setDeleteDialogOpen(true);
  };

  const handleGenerateLog = () => {
    setShouldLoadEvents(true);
  };

  const handleReschedule = () => {
    router.push(`/reschedule?classInstanceId=${id}`);
  };

  const handleInfoEdit = () => {
    router.push(`/classes/${id}/audit`);
  };

  const pageHeader = <ClassDetailsHeader instance={instance} canOverride={canOverride} isMobile={isMobile} />;

  const sessionActionProps = {
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
    onStart: () => startSessionMutation(),
    onAbsent: () => markAbsentMutation(),
    onLeave: (reason: string) => processLeaveMutation(reason),
    onReset: () => resetSessionMutation(),
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
    error: null,
  };

  const actionFeedbackAlert = feedbackState ? (
    <Alert severity={feedbackState.severity} sx={{ mb: 2 }}>
      {feedbackState.message}
    </Alert>
  ) : null;

  const deleteDialog = (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{t("deleteConfirm.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t("deleteConfirm.message")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>{t("deleteConfirm.cancel")}</Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
          {t("deleteConfirm.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <PageContainer>
      {pageHeader}
      {actionFeedbackAlert}
      <RequirePermission permissions={AppPermission.SessionOverrideActions}>
        <AdminView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={() => setIsWarningDismissed(true)}
          onForceActivate={handleForceActivate}
          onStop={handleStop}
          onGenerateLog={handleGenerateLog}
          onReschedule={handleReschedule}
          onDelete={handleDeleteRequest}
          {...sessionActionProps}
        />
      </RequirePermission>
      <RequirePermission permissions={AppPermission.SessionViewDetails}>
        <TeacherView
          instance={instance}
          viewMode={isParentView ? "parent" : "teacher"}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={() => setIsWarningDismissed(true)}
          onActivate={handleActivate}
          onStop={handleStop}
          onInfoEdit={handleInfoEdit}
          onDelete={handleDeleteRequest}
          {...sessionActionProps}
        />
      </RequirePermission>
      {deleteDialog}
    </PageContainer>
  );
}
