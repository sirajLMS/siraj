"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { PageContainer } from "@/frontend/components/ui";
import { ErrorState } from "@/frontend/components/ui/ErrorState";
import { LoadingState } from "@/frontend/components/ui/LoadingState";
import type { ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { formatScheduleTimeOnly } from "@/frontend/views/dashboard/admin/dashboard/utils/formatScheduleTime";
import { useRouter } from "@/shared/i18n/routing";
import { ClassDetailsContent } from "./components/ClassDetailsContent";
import { useClassActionHandlers } from "./hooks/useClassActionHandlers";
import { useClassDetailsContainerState } from "./hooks/useClassDetailsContainerState";
import { useClassDetailsPermissions } from "./hooks/useClassDetailsPermissions";
import { useClassDetailsData } from "./hooks/useClassDetailsQuery";
import { useClassMutations } from "./hooks/useClassMutations";
import { useEventLogDownload } from "./hooks/useEventLogDownload";
import { formatClassDetailDate } from "./types";

function InvalidIdState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <Box sx={theme => ({ p: 3, textAlign: "center", color: theme.palette.onSurfaceVariant })}>
      {t("invalidClassId")}
    </Box>
  );
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

  const {
    isWarningDismissed,
    setIsWarningDismissed,
    feedbackState,
    setFeedbackState,
    shouldLoadEvents,
    setShouldLoadEvents,
    deleteDialogOpen,
    setDeleteDialogOpen,
  } = useClassDetailsContainerState();

  const { data, loading, error } = useClassDetailsData(id);
  useEventLogDownload(id, shouldLoadEvents, setShouldLoadEvents, setFeedbackState, t);

  const mutations = useClassMutations({
    id,
    onError: message => setFeedbackState({ message, severity: "error" }),
  });

  const handlers = useClassActionHandlers(id, mutations, router, setFeedbackState, t);
  const { canOverride, isParentView } = useClassDetailsPermissions(hasPermission);

  if (loading) {
    return <LoadingState />;
  }

  if (!id) {
    return <InvalidIdState t={t} />;
  }

  if (error || !data?.classInstance) {
    logger.error("Error fetching class details:", error);
    return <ErrorState t={t} />;
  }

  const instance = data.classInstance as ClassInstanceDetail;
  const formattedScheduledDate = formatClassDetailDate(instance.scheduledDate, locale);
  const formattedStartTime = formatScheduleTimeOnly(instance.startTime, locale);
  const formattedEndTime = formatScheduleTimeOnly(instance.endTime, locale);

  const sessionActionProps = {
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
      <ClassDetailsContent
        instance={instance}
        canOverride={canOverride}
        isParentView={isParentView}
        isMobile={isMobile}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={() => setIsWarningDismissed(true)}
        handlers={handlers}
        sessionActionProps={sessionActionProps}
        feedbackState={feedbackState}
        deleteDialogOpen={deleteDialogOpen}
        onCloseDeleteDialog={() => setDeleteDialogOpen(false)}
        onConfirmDelete={handlers.handleDeleteConfirm}
        t={t}
        formattedScheduledDate={formattedScheduledDate}
        formattedStartTime={formattedStartTime}
        formattedEndTime={formattedEndTime}
      />
    </PageContainer>
  );
}
