"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classSubjectByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { logger } from "@/frontend/common/utils/logger";
import { SubjectDetailView } from "@/frontend/common/views/dashboard/subjects/detail/SubjectDetailView";
import type {
  SubjectDetailContainerProps,
  SubjectResourceItem,
} from "@/frontend/common/views/dashboard/subjects/detail/types";
import { useAppTranslation } from "@/shared/locale/client";
import { getErrorMessage } from "@/shared/utils/error";

export function SubjectDetailContainer({ subjectId }: Readonly<SubjectDetailContainerProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;
  const notifications = useNotifications();

  const { data, loading, error } = useQuery(classSubjectByIdQueryDocument, {
    variables: { id: subjectId },
    skip: !subjectId,
  });

  const subject = data?.classSubject ?? null;

  useDocumentTitle(subject?.name, "dashboard.subjects", "pageTitle");

  const resources = useMemo<readonly SubjectResourceItem[]>(() => {
    if (!subject?.resources) return [];
    return [...subject.resources].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [subject?.resources]);

  const breadcrumbs = useMemo(
    () => [
      { label: t.pageTitle, href: "/subjects" },
      { label: subject?.name ?? "", current: true },
    ],
    [t, subject?.name]
  );

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error fetching subject detail:", error);
    notifications.show(getErrorMessage(error), { severity: "error", autoHideDuration: 4000 });
  }

  if (!subject) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Typography variant="bodyMd">{t.detail.notFound}</Typography>
      </Box>
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.SubjectsViewResources]}>
      <SubjectDetailView subject={subject} resources={resources} breadcrumbs={breadcrumbs} />
    </RequirePermission>
  );
}
