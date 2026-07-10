"use client";

import { useQuery } from "@apollo/client/react";
import { Tab, Tabs } from "@mui/material";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { studentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentHistoryStore } from "@/frontend/stores/studentHistoryStore";
import { StudentHistoryContainer } from "@/frontend/views/dashboard/students/history/StudentHistoryContainer";
import {
  StudentProfileProvider,
  type StudentProfileQueryData,
} from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import { StudentQuotaContainer } from "@/frontend/views/dashboard/students/quota/StudentQuotaContainer";
import { StudentStatusContainer } from "@/frontend/views/dashboard/students/status/StudentStatusContainer";
import { useRouter } from "@/shared/i18n/routing";

const STUDENT_PROFILE_TABS = ["status", "quota", "history"] as const;
type StudentProfileTab = (typeof STUDENT_PROFILE_TABS)[number];

function isStudentProfileTab(value: string | null): value is StudentProfileTab {
  return STUDENT_PROFILE_TABS.includes(value as StudentProfileTab);
}

export function StudentProfilePageClient() {
  const t = useTranslations("dashboard.studentProfile");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = typeof params?.id === "string" ? params.id : "";

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<StudentProfileTab>(isStudentProfileTab(tabParam) ? tabParam : "status");

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    setActiveTab(isStudentProfileTab(nextTab) ? nextTab : "status");
  }, [searchParams]);

  const { currentMonth } = useStudentHistoryStore();
  const year = activeTab === "history" ? currentMonth.getFullYear() : undefined;
  const month = activeTab === "history" ? currentMonth.getMonth() + 1 : undefined;

  const { data, loading, refetch } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year, month },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const profile = (data as { studentProfile?: StudentProfileQueryData | null } | undefined)?.studentProfile;

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, nextTab: StudentProfileTab) => {
      setActiveTab(nextTab);
      router.replace(`/students/${studentId}/profile?tab=${nextTab}`);
    },
    [router, studentId]
  );

  const contextValue = useMemo(
    () => ({
      studentId,
      profile,
      loading,
      refetch: async () => refetch(),
    }),
    [studentId, profile, loading, refetch]
  );

  if (!studentId) {
    return null;
  }

  return (
    <StudentProfileProvider value={contextValue}>
      <PageContainer>
        <PageHeader title={profile?.name ?? t("title")} subtitle={t("subtitle")} />
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab value="status" label={t("tabs.status")} />
          <Tab value="quota" label={t("tabs.quota")} />
          <Tab value="history" label={t("tabs.history")} />
        </Tabs>

        {activeTab === "status" ? <StudentStatusContainer /> : null}
        {activeTab === "quota" ? <StudentQuotaContainer /> : null}
        {activeTab === "history" ? <StudentHistoryContainer /> : null}
      </PageContainer>
    </StudentProfileProvider>
  );
}
