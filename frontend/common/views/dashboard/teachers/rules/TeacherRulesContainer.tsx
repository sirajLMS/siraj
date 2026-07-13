"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ActivationPolicyPanel } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ActivationPolicyPanel";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";

export function TeacherRulesContainer() {
  const t = useTranslations("dashboard.teacherDashboard");
  const dashboardT = useTranslations("dashboard");
  const tJoin = useTranslations("ui.meetingConfig.join");
  const labels = buildTeacherDashboardLabels(t, dashboardT, tJoin("emptyTeacher"));
  const [handbookRequested, setHandbookRequested] = useState(false);
  const { data: handbookData, loading: handbookLoading } = useQuery(teacherHandbookUrlQueryDocument, {
    skip: !handbookRequested,
  });

  useEffect(() => {
    if (handbookRequested && !handbookLoading) {
      if (handbookData?.teacherHandbookUrl?.url) {
        globalThis.open(handbookData.teacherHandbookUrl.url, "_blank");
      }
      setHandbookRequested(false);
    }
  }, [handbookRequested, handbookLoading, handbookData]);

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
      <PageContainer>
        <PageHeader title={t("rules.pageTitle")} subtitle={t("rules.pageSubtitle")} />
        {handbookLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : null}
        <ActivationPolicyPanel
          labels={labels.policy}
          actionLabels={labels.actions}
          onDownloadHandbook={() => setHandbookRequested(true)}
          onContactCoordinator={() => {
            globalThis.location.href = "mailto:support@siraj.edu";
          }}
        />
      </PageContainer>
    </RequirePermission>
  );
}
