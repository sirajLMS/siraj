"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useStudentHistoryStore } from "@/frontend/common/stores/studentHistoryStore";
import type {
  StudentProfileContextValue,
  StudentProfileQueryData,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import {
  getVisibleStudentProfileTabs,
  resolveStudentProfileTab,
  type StudentProfileTab,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { useRouter } from "@/shared/i18n/routing";
import { type StudentStatusLabels, useAppTranslation } from "@/shared/locale";

const STATUS_BADGE_KEY: Record<StudentStatus, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function buildStudentStatusLabel(tStatus: StudentStatusLabels): Record<StudentStatus, string> {
  return {
    [StudentStatus.Regular]: tStatus.statusOptions.REGULAR,
    [StudentStatus.Suspended]: tStatus.statusOptions.SUSPENDED,
    [StudentStatus.OnLeave]: tStatus.statusOptions.ON_LEAVE,
    [StudentStatus.OnTrial]: tStatus.statusOptions.ON_TRIAL,
    [StudentStatus.Deactivated]: tStatus.statusOptions.DEACTIVATED,
  };
}

export interface StudentProfileHeaderValues {
  readonly title: string;
  readonly subtitle: string;
}

export interface StudentProfileStatusBadge {
  readonly category: "studentAccount";
  readonly status: string;
  readonly label: string;
}

export type StudentProfileLoadingState = "loading" | "notFound" | "ready";

export interface StudentProfilePageViewModel {
  readonly studentId: string;
  readonly loadingState: StudentProfileLoadingState;
  readonly profile: StudentProfileQueryData | undefined;
  readonly contextValue: StudentProfileContextValue;
  readonly header: StudentProfileHeaderValues;
  readonly statusBadge: StudentProfileStatusBadge | undefined;
  readonly visibleTabs: readonly StudentProfileTab[];
  readonly activeTab: StudentProfileTab | null;
  readonly fallbackTitle: string;
  readonly loadingLabel: string;
  readonly notFoundTitle: string;
  readonly notFoundDescription: string;
  readonly tabLabels: {
    readonly status: string;
    readonly classes: string;
    readonly quota: string;
    readonly history: string;
  };
  readonly onTabChange: (event: React.SyntheticEvent, nextTab: StudentProfileTab) => void;
}

export interface UseStudentProfilePageViewModelProps {
  readonly studentId: string;
}

export function useStudentProfilePageViewModel(
  props: Readonly<UseStudentProfilePageViewModelProps>
): StudentProfilePageViewModel {
  const { studentId } = props;

  const t = useAppTranslation().dashboardTranslations.studentProfile;
  const tStatus = useAppTranslation().dashboardTranslations.studentStatus;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentMonth } = useStudentHistoryStore();
  const { canView, showField } = useStudentFieldAccess();

  const visibleTabs = useMemo(() => getVisibleStudentProfileTabs(canView), [canView]);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<StudentProfileTab | null>(() =>
    resolveStudentProfileTab(tabParam, canView)
  );

  const activeTabForQuery = activeTab ?? resolveStudentProfileTab(tabParam, canView);
  const year = activeTabForQuery === "history" ? currentMonth.getFullYear() : undefined;
  const month = activeTabForQuery === "history" ? currentMonth.getMonth() + 1 : undefined;

  const { data, loading, refetch } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: year ?? null, month: month ?? null },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const profile = (data?.studentProfile ?? undefined) as StudentProfileQueryData | undefined;

  useDocumentTitle(profile?.name, "dashboard.studentProfile", "title");

  const contextValue = useMemo<StudentProfileContextValue>(
    () => ({
      studentId,
      profile: profile ?? null,
      loading,
      refetch: async (variables?: { readonly year?: number | null; readonly month?: number | null }) =>
        refetch(variables ?? {}),
    }),
    [studentId, profile, loading, refetch]
  );

  useEffect(() => {
    const nextResolved = resolveStudentProfileTab(searchParams.get("tab"), canView);
    setActiveTab(nextResolved);
    const currentParam = searchParams.get("tab");
    if (nextResolved && currentParam !== nextResolved) {
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

  const loadingState: StudentProfileLoadingState = loading && !profile ? "loading" : !profile ? "notFound" : "ready";

  const studentStatusLabel = useMemo(() => buildStudentStatusLabel(tStatus), [tStatus]);

  const header = useMemo<StudentProfileHeaderValues>(() => {
    const showName = profile ? showField(profile.name, "student_identity") : false;
    if (showName && profile?.name) {
      return { title: profile.name, subtitle: t.subtitle };
    }
    if (profile?.id) {
      return { title: t.title, subtitle: t.restrictedIdentity(profile.id) };
    }
    return { title: t.title, subtitle: t.restrictedIdentityGeneric };
  }, [profile, showField, t.title, t.subtitle, t.restrictedIdentity, t.restrictedIdentityGeneric]);

  const statusBadge = useMemo<StudentProfileStatusBadge | undefined>(() => {
    const showStatus = canView("student_academic") && profile?.status != null;
    if (!showStatus || !profile?.status) {
      return undefined;
    }
    return {
      category: "studentAccount",
      status: STATUS_BADGE_KEY[profile.status] ?? "regular",
      label: studentStatusLabel[profile.status],
    };
  }, [canView, profile, studentStatusLabel]);

  return {
    studentId,
    loadingState,
    profile,
    contextValue,
    header,
    statusBadge,
    visibleTabs,
    activeTab,
    fallbackTitle: t.title,
    loadingLabel: t.loading,
    notFoundTitle: t.notFoundTitle,
    notFoundDescription: t.notFoundDescription,
    tabLabels: t.tabs,
    onTabChange: handleTabChange,
  };
}

export type { StudentProfileContextValue, StudentProfileQueryData };
