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
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { classInstanceQueryDocument, classStatusEventsQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { formatScheduleTimeOnly } from "@/frontend/views/dashboard/admin/dashboard/utils/formatScheduleTime";
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

function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  cancelLabel,
  confirmLabel,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ActionFeedbackAlert({ feedbackState }: { readonly feedbackState: ActionFeedbackState | null }) {
  if (!feedbackState) return null;
  return (
    <Alert
      severity={feedbackState.severity}
      sx={theme => ({
        mb: 2,
        [theme.breakpoints.down("lg")]: {
          borderRadius: 0,
          paddingInline: theme.spacing(2),
          borderInlineStart: "none",
          borderInlineEnd: "none",
        },
      })}
    >
      {feedbackState.message}
    </Alert>
  );
}

function useEventLogDownload(
  id: string,
  shouldLoadEvents: boolean,
  setShouldLoadEvents: (value: boolean) => void,
  setFeedbackState: (state: ActionFeedbackState | null) => void,
  t: ReturnType<typeof useTranslations>
) {
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
  }, [eventsData, shouldLoadEvents, id, t, setFeedbackState, setShouldLoadEvents]);

  useEffect(() => {
    if (shouldLoadEvents && eventsError) {
      logger.error("Error fetching class status events:", eventsError);
      setFeedbackState({ message: t("loadError"), severity: "error" });
      setShouldLoadEvents(false);
    }
  }, [eventsError, shouldLoadEvents, t, setFeedbackState, setShouldLoadEvents]);
}

interface ClassActionHandlers {
  readonly handleForceActivate: () => Promise<void>;
  readonly handleStop: () => Promise<void>;
  readonly handleActivate: () => Promise<void>;
  readonly handleDeleteConfirm: () => Promise<void>;
  readonly handleReschedule: () => void;
  readonly handleInfoEdit: () => void;
}

function useClassActionHandlers(
  id: string,
  mutations: ReturnType<typeof useClassMutations>,
  router: ReturnType<typeof useRouter>,
  setFeedbackState: (state: ActionFeedbackState | null) => void,
  t: ReturnType<typeof useTranslations<"string">>
): ClassActionHandlers {
  return {
    handleForceActivate: async () => {
      try {
        await mutations.forceActivate();
        setFeedbackState({ message: t("actionFeedback.forceActivateSuccess"), severity: "success" });
      } catch {
        // Error feedback is handled by useClassMutations onError
      }
    },
    handleStop: async () => {
      try {
        await mutations.stopClass();
        setFeedbackState({ message: t("actionFeedback.stopSuccess"), severity: "success" });
      } catch {
        // Error feedback is handled by useClassMutations onError
      }
    },
    handleActivate: async () => {
      try {
        await mutations.activate();
        setFeedbackState({ message: t("actionFeedback.activateSuccess"), severity: "success" });
      } catch {
        // Error feedback is handled by useClassMutations onError
      }
    },
    handleDeleteConfirm: async () => {
      try {
        await mutations.deleteClass();
        router.push("/dashboard");
      } catch {
        setFeedbackState({ message: t("actionFeedback.deleteError"), severity: "error" });
      }
    },
    handleReschedule: () => {
      router.push(`/reschedule?classInstanceId=${id}`);
    },
    handleInfoEdit: () => {
      router.push(`/classes/${id}/audit`);
    },
  };
}

function useClassDetailsQuery(id: string) {
  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id },
    skip: !id,
  });
  return { data, loading, error };
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

  const { data, loading, error } = useClassDetailsQuery(id);
  useEventLogDownload(id, shouldLoadEvents, setShouldLoadEvents, setFeedbackState, t);

  const mutations = useClassMutations({
    id,
    onError: message => setFeedbackState({ message, severity: "error" }),
  });

  const handlers = useClassActionHandlers(id, mutations, router, setFeedbackState, t);

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

  const sessionActionProps = {
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
    onStart: () => mutations.startSession(),
    onAbsent: () => mutations.markAbsent(),
    onLeave: (reason: string) => mutations.processLeave(reason),
    onReset: () => mutations.resetSession(),
    isStarting: mutations.isStarting,
    isMarkingAbsent: mutations.isMarkingAbsent,
    isProcessingLeave: mutations.isProcessingLeave,
    isResetting: mutations.isResetting,
    error: null,
  };

  return (
    <PageContainer>
      <ClassDetailsHeader instance={instance} canOverride={canOverride} isMobile={isMobile} />
      <ActionFeedbackAlert feedbackState={feedbackState} />
      {canOverride ? (
        <AdminView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={() => setIsWarningDismissed(true)}
          onForceActivate={handlers.handleForceActivate}
          onStop={handlers.handleStop}
          onGenerateLog={() => setShouldLoadEvents(true)}
          onReschedule={handlers.handleReschedule}
          onDelete={() => setDeleteDialogOpen(true)}
          {...sessionActionProps}
        />
      ) : (
        <RequirePermission permissions={AppPermission.SessionViewDetails}>
          <TeacherView
            instance={instance}
            viewMode={isParentView ? "parent" : "teacher"}
            isWarningDismissed={isWarningDismissed}
            onDismissWarning={() => setIsWarningDismissed(true)}
            onActivate={handlers.handleActivate}
            onStop={handlers.handleStop}
            onInfoEdit={handlers.handleInfoEdit}
            onDelete={() => setDeleteDialogOpen(true)}
            {...sessionActionProps}
          />
        </RequirePermission>
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handlers.handleDeleteConfirm}
        title={t("deleteConfirm.title")}
        message={t("deleteConfirm.message")}
        cancelLabel={t("deleteConfirm.cancel")}
        confirmLabel={t("deleteConfirm.confirm")}
      />
    </PageContainer>
  );
}
