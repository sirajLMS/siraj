"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classSubjectByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import { logger } from "@/frontend/common/utils/logger";
import { SubjectDetailView } from "@/frontend/common/views/dashboard/subjects/detail/SubjectDetailView";
import type { SubjectDetailContainerProps } from "@/frontend/common/views/dashboard/subjects/detail/types";
import type { SubjectDetailViewModelLabels } from "@/frontend/common/views/dashboard/subjects/detail/useSubjectDetailViewModel";
import { useAppTranslation } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

/**
 * SubjectDetailContainer — orchestrator only.
 *
 * Wires the i18n labels + permission guard into the `SubjectDetailView`
 * switcher. The actual GraphQL fetch, resources sort, breadcrumbs memo, and
 * notFound derivation live in the `useSubjectDetailViewModel` hook driven by
 * `SubjectDetailView`. The hook-driven fetch error surfaces through the
 * `notifications.show` side-effect centralised here (rather than imported by
 * either tier View).
 */
export function SubjectDetailContainer({ subjectId }: Readonly<SubjectDetailContainerProps>) {
  const { subjects } = useAppTranslation().dashboardTranslations;
  const notifications = useNotifications();

  const labels: SubjectDetailViewModelLabels = {
    pageTitle: subjects.detail.pageTitle,
    notFound: subjects.detail.notFound,
    resourcesTitle: subjects.detail.resourcesTitle,
    resourcesSubtitle: subjects.detail.resourcesSubtitle,
    noResources: subjects.detail.noResources,
    download: subjects.detail.download,
    untitledResource: subjects.detail.untitledResource,
    subjectsPageTitle: subjects.pageTitle,
  };

  // Centralise fetch-error notifications so neither tier View depends on
  // @toolpad/core. The View tier renders loading / notFound hand-off states
  // based on the view-model; the toast for errors is fired here.
  // DataSource hook below doesn't itself subscribe to network status — we
  // listen to the same query the View-model hook asks for; Apollo's cache
  // dedupes both subscriptions, so the actual network request is still single.
  const { data, loading, error } = useQuery(classSubjectByIdQueryDocument, {
    variables: { id: subjectId },
    skip: !subjectId,
  });

  useEffect(() => {
    if (error) {
      logger.error("Error fetching subject detail:", error);
      notifications.show(getErrorMessage(error), { severity: "error", autoHideDuration: 4000 });
    }
  }, [error, notifications]);

  // Track the document title based on the fetched subject's name.
  const subjectName = data?.classSubject?.name ?? null;
  useEffect(() => {
    if (subjectName) {
      document.title = `${subjectName} | Siraj`;
    } else if (!loading) {
      document.title = `${subjects.pageTitle} | Siraj`;
    }
  }, [subjectName, loading, subjects.pageTitle]);

  // Render a fallback box for the loading state to preserve SSR hydration
  // before the View-model-driven View take over rendering. This is a no-op
  // once the View tier renders its own loading state through the switcher.
  if (loading && !data) {
    return (
      <RequirePermission permissions={[AppPermission.SubjectsViewResources]}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      </RequirePermission>
    );
  }

  if (!loading && !data?.classSubject) {
    return (
      <RequirePermission permissions={[AppPermission.SubjectsViewResources]}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Typography variant="bodyMd">{subjects.detail.notFound}</Typography>
        </Box>
      </RequirePermission>
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.SubjectsViewResources]}>
      <SubjectDetailView subjectId={subjectId} labels={labels} />
    </RequirePermission>
  );
}
