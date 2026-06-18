"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  activateClassMutationDocument,
  classInstanceQueryDocument,
  deleteClassInstanceMutationDocument,
  forceActivateClassMutationDocument,
  stopClassMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ClassDetailsAdminView } from "./admin/ClassDetailsAdminView";
import { ClassDetailsHeader } from "./ClassDetailsHeader";
import { ClassDetailsTeacherView } from "./teacher/ClassDetailsTeacherView";
import { useAdminViewLabels, useTeacherViewLabels } from "./useClassDetailsLabels";

interface AdminViewWrapperProps {
  readonly pageHeader: React.ReactNode;
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onDelete: () => void;
}

const AdminViewWrapper = ({
  pageHeader,
  instance,
  isWarningDismissed,
  onDismissWarning,
  onForceActivate,
  onStop,
  onDelete,
}: AdminViewWrapperProps) => {
  const labels = useAdminViewLabels(instance.studentTimezone ?? "");

  const handleGenerateLog = () => {
    logger.info("Admin generate log:", instance.id);
  };

  return (
    <PageContainer>
      {pageHeader}
      <ClassDetailsAdminView
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={onDismissWarning}
        onForceActivate={onForceActivate}
        onStop={onStop}
        onGenerateLog={handleGenerateLog}
        onDelete={onDelete}
        labels={labels}
      />
    </PageContainer>
  );
};

interface TeacherViewWrapperProps {
  readonly pageHeader: React.ReactNode;
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onActivate: () => void;
  readonly onStop: () => void;
  readonly onDelete: () => void;
}

const TeacherViewWrapper = ({
  pageHeader,
  instance,
  isWarningDismissed,
  onDismissWarning,
  onActivate,
  onStop,
  onDelete,
}: TeacherViewWrapperProps) => {
  const labels = useTeacherViewLabels(instance.studentTimezone ?? "");

  const handleInfoEdit = () => {
    logger.info("Teacher info/edit:", instance.id);
  };
  const handleViewProfile = () => {
    logger.info("View student profile:", instance.student?.id ?? "");
  };

  return (
    <PageContainer>
      {pageHeader}
      <ClassDetailsTeacherView
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={onDismissWarning}
        onActivate={onActivate}
        onStop={onStop}
        onInfoEdit={handleInfoEdit}
        onDelete={onDelete}
        onViewProfile={handleViewProfile}
        labels={labels}
      />
    </PageContainer>
  );
};

export function ClassDetailsContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const locale = useLocale();

  const { id } = useParams() as { id: string };
  const hasPermission = useUserStore(state => state.hasPermission);

  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const { data, loading, error } = useQuery(classInstanceQueryDocument, {
    variables: { id },
  });

  const [activateClass] = useMutation(activateClassMutationDocument);
  const [forceActivateClass] = useMutation(forceActivateClassMutationDocument);
  const [stopClass] = useMutation(stopClassMutationDocument);
  const [deleteClass] = useMutation(deleteClassInstanceMutationDocument);

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
      await forceActivateClass({ variables: { classInstanceId: id } });
      logger.info("Admin force-activated session:", id);
    } catch (err) {
      logger.error("Error in forceActivateClass:", err);
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

  const pageHeader = <ClassDetailsHeader instance={instance} canOverride={canOverride} isMobile={isMobile} />;

  if (canOverride) {
    return (
      <AdminViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={() => setIsWarningDismissed(true)}
        onForceActivate={handleForceActivate}
        onStop={handleStop}
        onDelete={handleDelete}
      />
    );
  }

  if (canView) {
    return (
      <TeacherViewWrapper
        pageHeader={pageHeader}
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={() => setIsWarningDismissed(true)}
        onActivate={handleActivate}
        onStop={handleStop}
        onDelete={handleDelete}
      />
    );
  }

  return null;
}
