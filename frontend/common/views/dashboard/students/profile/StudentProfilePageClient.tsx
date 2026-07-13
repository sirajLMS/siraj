"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useStudentHistoryStore } from "@/frontend/common/stores/studentHistoryStore";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer";
import {
  StudentProfileProvider,
  type StudentProfileQueryData,
} from "@/frontend/common/views/dashboard/students/profile/StudentProfileContext";
import {
  getVisibleStudentProfileTabs,
  resolveStudentProfileTab,
  type StudentProfileTab,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { StudentQuotaContainer } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaContainer";
import { StudentStatusContainer } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";
import { useRouter } from "@/shared/i18n/routing";

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}

function StudentProfilePageContent({
  studentId,
  profile,
  loading,
}: {
  readonly studentId: string;
  readonly profile: StudentProfileQueryData | undefined;
  readonly loading: boolean;
}) {
  const t = useTranslations("dashboard.studentProfile");
  const tStatus = useTranslations("dashboard.studentStatus");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { canView, showField } = useStudentFieldAccess();

  const visibleTabs = useMemo(() => getVisibleStudentProfileTabs(canView), [canView]);
  const tabParam = searchParams.get("tab");
  const resolvedTab = resolveStudentProfileTab(tabParam, canView);
  const [activeTab, setActiveTab] = useState<StudentProfileTab | null>(resolvedTab);

  useEffect(() => {
    const nextResolved = resolveStudentProfileTab(searchParams.get("tab"), canView);
    setActiveTab(nextResolved);

    if (nextResolved && searchParams.get("tab") !== nextResolved) {
      router.replace(`/students/${studentId}/profile?tab=${nextResolved}`);
    }
  }, [searchParams, canView, studentId, router]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, nextTab: StudentProfileTab) => {
      setActiveTab(nextTab);
      router.replace(`/students/${studentId}/profile?tab=${nextTab}`);
    },
    [router, studentId]
  );

  if (loading && !profile) {
    return (
      <PageContainer>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 10 }}>
          <CircularProgress />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t("loading")}
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <ProfileRestrictedSection title={t("notFoundTitle")} description={t("notFoundDescription")} />
      </PageContainer>
    );
  }

  const showName = showField(profile?.name, "student_identity");
  const showStatus = canView("student_academic") && profile?.status != null;
  const headerTitle = showName && profile?.name ? profile.name : t("title");
  const headerSubtitle =
    showName && profile?.name
      ? t("subtitle")
      : profile?.id
        ? t("restrictedIdentity", { id: profile.id })
        : t("restrictedIdentityGeneric");

  return (
    <PageContainer>
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        actions={
          showStatus && profile?.status ? (
            <StatusBadge
              category="studentAccount"
              status={getBadgeStatusKey(profile.status)}
              label={tStatus(`statusOptions.${profile.status}`)}
            />
          ) : undefined
        }
      />

      {visibleTabs.length === 0 ? (
        <ProfileRestrictedSection title={t("title")} />
      ) : (
        <>
          <Tabs value={activeTab ?? visibleTabs[0]} onChange={handleTabChange} sx={{ mb: 3 }}>
            {visibleTabs.includes("status") ? <Tab value="status" label={t("tabs.status")} /> : null}
            {visibleTabs.includes("quota") ? <Tab value="quota" label={t("tabs.quota")} /> : null}
            {visibleTabs.includes("history") ? <Tab value="history" label={t("tabs.history")} /> : null}
          </Tabs>

          {activeTab === "status" ? <StudentStatusContainer /> : null}
          {activeTab === "quota" ? <StudentQuotaContainer /> : null}
          {activeTab === "history" ? <StudentHistoryContainer /> : null}
        </>
      )}
    </PageContainer>
  );
}

export function StudentProfilePageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = typeof params?.id === "string" ? params.id : "";

  const { currentMonth } = useStudentHistoryStore();
  const activeTab = searchParams.get("tab") ?? "status";
  const year = activeTab === "history" ? currentMonth.getFullYear() : undefined;
  const month = activeTab === "history" ? currentMonth.getMonth() + 1 : undefined;

  const { data, loading, refetch } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: year ?? null, month: month ?? null },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const profile = (data?.studentProfile ?? undefined) as StudentProfileQueryData | undefined;

  useDocumentTitle(profile?.name, "dashboard.studentProfile", "title");

  const contextValue = useMemo(
    () => ({
      studentId,
      profile,
      loading,
      refetch: async (variables?: { readonly year?: number | null; readonly month?: number | null }) =>
        refetch(variables ?? {}),
    }),
    [studentId, profile, loading, refetch]
  );

  if (!studentId) {
    return null;
  }

  return (
    <StudentProfileProvider value={contextValue}>
      <StudentProfilePageContent studentId={studentId} profile={profile} loading={loading} />
    </StudentProfileProvider>
  );
}
