"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
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
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  activateClassMutationDocument,
  activateOverrideClassMutationDocument,
  classInstanceQueryDocument,
  classStatusEventsQueryDocument,
  deleteClassInstanceMutationDocument,
  resetClassMutationDocument,
  stopClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { formatScheduleTimeOnly } from "@/frontend/views/dashboard/dashboard/utils/formatScheduleTime";
import { useRouter } from "@/shared/i18n/routing";
import { getErrorMessage } from "@/shared/utils/error";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "./ClassDetailsHeader";
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

export function ClassDetailsContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.classDetails");
  const client = useApolloClient();

  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? rawId : "";
  const hasPermission = useUserStore(state => state.hasPermission);

  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
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
      } catch (err) {
        logger.error("Error generating log:", err);
        setErrorState(getErrorMessage(err));
      } finally {
        setShouldLoadEvents(false);
      }
    }
  }, [eventsData, shouldLoadEvents, id]);

  useEffect(() => {
    if (shouldLoadEvents && eventsError) {
      logger.error("Error fetching class status events:", eventsError);
      setErrorState(eventsError.message);
      setShouldLoadEvents(false);
    }
  }, [eventsError, shouldLoadEvents]);

  const [activateClass] = useMutation(activateClassMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const [activateOverrideClass] = useMutation(activateOverrideClassMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const [stopClass] = useMutation(stopClassMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const [deleteClass] = useMutation(deleteClassInstanceMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      setDeleteDialogOpen(false);
    },
    onError: err => setErrorState(err.message),
  });

  const [startSession, { loading: isStarting }] = useMutation(updateSessionStatusStartMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const [markAbsent, { loading: isMarkingAbsent }] = useMutation(updateSessionStatusAbsentMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const [processLeave, { loading: isProcessingLeave }] = useMutation(updateSessionStatusLeaveMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const [resetSession, { loading: isResetting }] = useMutation(resetClassMutationDocument, {
    onCompleted: () => {
      setErrorState(null);
      client.refetchQueries({ include: [classInstanceQueryDocument] });
    },
    onError: err => setErrorState(err.message),
  });

  const canOverride = hasPermission(AppPermission.SessionOverrideActions);
  const canView = hasPermission(AppPermission.SessionViewDetails);
  const canActivate = hasPermission(AppPermission.SessionActivateClass);
  const isParentView = hasPermission(AppPermission.ScheduleViewFamily) && !canActivate && !canOverride;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!id) {
    return <Box sx={{ p: 3, textAlign: "center" }}>Invalid Class ID</Box>;
  }

  if (error || !data?.classInstance) {
    logger.error("Error fetching class details:", error);
    return (
      <PageContainer>
        <Alert severity="error">{error?.message ?? t("loadError")}</Alert>
      </PageContainer>
    );
  }

  const instance = data.classInstance;
  const formattedScheduledDate = formatClassDetailDate(instance.scheduledDate, locale);
  const formattedStartTime = formatScheduleTimeOnly(instance.startTime, locale);
  const formattedEndTime = formatScheduleTimeOnly(instance.endTime, locale);

  const handleForceActivate = async () => {
    try {
      await activateOverrideClass({ variables: { classInstanceId: id } });
      logger.info("Admin force-activated session:", id);
    } catch (err) {
      logger.error("Error in activateOverrideClass:", err);
    }
  };

  const handleStop = async () => {
    try {
      await stopClass({ variables: { classInstanceId: id } });
      logger.info("Stopped session:", id);
    } catch (err) {
      logger.error("Error in stopClass:", err);
    }
  };

  const handleActivate = async () => {
    try {
      await activateClass({ variables: { classInstanceId: id } });
      logger.info("Teacher activated session:", id);
    } catch (err) {
      logger.error("Error in activateClass:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteClass({ variables: { classInstanceId: id } });
      logger.warn("Deleted class instance:", id);
      router.push("/dashboard");
    } catch (err) {
      logger.error("Error in deleteClass:", err);
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
    onStart: () => startSession({ variables: { classInstanceId: id } }),
    onAbsent: () => markAbsent({ variables: { classInstanceId: id } }),
    onLeave: (reason: string) => processLeave({ variables: { classInstanceId: id, leaveReason: reason } }),
    onReset: () => resetSession({ variables: { classInstanceId: id } }),
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
    error: errorState,
  };

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

  if (canOverride) {
    return (
      <PageContainer>
        {pageHeader}
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
        {deleteDialog}
      </PageContainer>
    );
  }

  if (canView) {
    return (
      <PageContainer>
        {pageHeader}
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
        {deleteDialog}
      </PageContainer>
    );
  }

  return null;
}
