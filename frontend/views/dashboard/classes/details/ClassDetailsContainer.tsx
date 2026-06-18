"use client";

import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
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
import { getErrorMessage } from "@/shared/utils/error";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "./ClassDetailsHeader";
import { ClassDetailsTeacherView } from "./teacher/ClassDetailsTeacherView";
import { useAdminViewLabels, useTeacherViewLabels } from "./useClassDetailsLabels";

interface CommonViewProps {
  readonly instance: ClassInstanceDetail;
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
}

const AdminView = (props: AdminViewProps) => {
  const labels = useAdminViewLabels(props.instance.studentTimezone ?? "");
  return <ClassDetailsAdminView {...props} labels={labels} />;
};

interface TeacherViewProps extends CommonViewProps {
  readonly onActivate: () => void;
  readonly onInfoEdit: () => void;
  readonly onViewProfile: () => void;
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
  const client = useApolloClient();

  const { id } = useParams() as { id: string };
  const hasPermission = useUserStore(state => state.hasPermission);

  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id },
  });

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.classInstance) {
    logger.error("Error fetching class details:", error);
    return null;
  }

  const instance = data.classInstance;

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

  const handleDelete = async () => {
    try {
      await deleteClass({ variables: { classInstanceId: id } });
      logger.warn("Deleted class instance:", id);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      logger.error("Error in deleteClass:", err);
    }
  };

  const handleGenerateLog = async () => {
    try {
      const { data: logData } = await client.query({
        query: classStatusEventsQueryDocument,
        variables: { classInstanceId: id },
      });

      if (logData?.classStatusEvents) {
        const blob = new Blob([JSON.stringify(logData.classStatusEvents, null, 2)], {
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
      }
    } catch (err) {
      logger.error("Error generating log:", err);
      setErrorState(getErrorMessage(err));
    }
  };

  const handleViewProfile = () => {
    if (instance.student?.id) {
      router.push(`/${locale}/students/${instance.student.id}/status`);
    }
  };

  const handleInfoEdit = () => {
    router.push(`/${locale}/classes/${id}/audit`);
  };

  const pageHeader = <ClassDetailsHeader instance={instance} canOverride={canOverride} isMobile={isMobile} />;

  const sessionActionProps = {
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
          onDelete={handleDelete}
          {...sessionActionProps}
        />
      </PageContainer>
    );
  }

  if (canView) {
    return (
      <PageContainer>
        {pageHeader}
        <TeacherView
          instance={instance}
          isWarningDismissed={isWarningDismissed}
          onDismissWarning={() => setIsWarningDismissed(true)}
          onActivate={handleActivate}
          onStop={handleStop}
          onInfoEdit={handleInfoEdit}
          onDelete={handleDelete}
          onViewProfile={handleViewProfile}
          {...sessionActionProps}
        />
      </PageContainer>
    );
  }

  return null;
}
