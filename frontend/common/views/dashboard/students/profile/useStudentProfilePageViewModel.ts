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
  isStudentProfileTab,
  type StudentProfileTab,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import type { StudentProfilePageLabelsBySection } from "@/frontend/common/views/dashboard/students/profile/types/studentProfilePage.types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { useRouter } from "@/shared/i18n/navigation";
import { type StudentStatusLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";

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
  readonly labelsBySection: StudentProfilePageLabelsBySection;
  readonly onTabChange: (event: React.SyntheticEvent, nextTab: StudentProfileTab) => void;
}

export interface UseStudentProfilePageViewModelProps {
  readonly studentId: string;
}

interface StudentProfileTabState {
  readonly activeTab: StudentProfileTab | null;
  readonly visibleTabs: readonly StudentProfileTab[];
  readonly onTabChange: (event: React.SyntheticEvent, nextTab: StudentProfileTab) => void;
  readonly activeTabForQuery: StudentProfileTab | null;
}

interface StudentProfileQueryState {
  readonly profile: StudentProfileQueryData | undefined;
  readonly loading: boolean;
  readonly loadingState: StudentProfileLoadingState;
  readonly refetch: (variables?: { readonly year?: number | null; readonly month?: number | null }) => Promise<unknown>;
}

interface StudentProfilePresentationState {
  readonly header: StudentProfileHeaderValues;
  readonly statusBadge: StudentProfileStatusBadge | undefined;
}

type StudentFieldAccess = ReturnType<typeof useStudentFieldAccess>;
type StudentProfileTranslations = StudentProfileLabels;

function useStudentProfileTabState(
  studentId: string,
  visibleTabs: readonly StudentProfileTab[],
  tabParam: string | null,
  router: ReturnType<typeof useRouter>
): StudentProfileTabState {
  const resolveTab = useCallback(
    (requestedTab: string | null): StudentProfileTab | null => {
      if (visibleTabs.length === 0) {
        return null;
      }
      if (isStudentProfileTab(requestedTab) && visibleTabs.includes(requestedTab)) {
        return requestedTab;
      }
      return visibleTabs[0] ?? null;
    },
    [visibleTabs]
  );

  const [activeTab, setActiveTab] = useState<StudentProfileTab | null>(() => resolveTab(tabParam));

  useEffect(() => {
    const nextResolved = resolveTab(tabParam);
    setActiveTab(prev => (prev === nextResolved ? prev : nextResolved));
    if (nextResolved && tabParam !== nextResolved) {
      router.replace(`/students/${studentId}/profile?tab=${nextResolved}`);
    }
  }, [tabParam, resolveTab, studentId, router]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, nextTab: StudentProfileTab) => {
      setActiveTab(nextTab);
      router.replace(`/students/${studentId}/profile?tab=${nextTab}`);
    },
    [router, studentId]
  );

  const activeTabForQuery = activeTab ?? resolveTab(tabParam);

  return { activeTab, visibleTabs, onTabChange: handleTabChange, activeTabForQuery };
}

function useStudentProfileQueryState(
  studentId: string,
  activeTabForQuery: StudentProfileTab | null,
  currentMonth: Date
): StudentProfileQueryState {
  const year = activeTabForQuery === "history" ? currentMonth.getFullYear() : undefined;
  const month = activeTabForQuery === "history" ? currentMonth.getMonth() + 1 : undefined;

  const { data, loading, refetch } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: year ?? null, month: month ?? null, includeUpcomingClasses: true },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.studentProfile ?? undefined;

  let loadingState: StudentProfileLoadingState;
  if (loading && !profile) {
    loadingState = "loading";
  } else if (!profile) {
    loadingState = "notFound";
  } else {
    loadingState = "ready";
  }

  return {
    profile,
    loading,
    loadingState,
    refetch: async (variables?: { readonly year?: number | null; readonly month?: number | null }) =>
      refetch(variables ?? {}),
  };
}

function useStudentProfilePresentation(
  profile: StudentProfileQueryData | undefined,
  access: StudentFieldAccess,
  tStatus: StudentStatusLabels,
  t: StudentProfileTranslations
): StudentProfilePresentationState {
  const { canView, showField } = access;
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
  }, [profile, showField, t]);

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

  return { header, statusBadge };
}

export function useStudentProfilePageViewModel(
  props: Readonly<UseStudentProfilePageViewModelProps>
): StudentProfilePageViewModel {
  const { studentId } = props;

  const t = useAppTranslation(Translation.Dashboard.StudentProfile);
  const tStatus = useAppTranslation(Translation.Dashboard.StudentStatus);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentMonth } = useStudentHistoryStore();
  const tabParam = searchParams.get("tab");

  const { profile, loading, loadingState, refetch } = useStudentProfileQueryState(studentId, null, currentMonth);

  const access = useStudentFieldAccess({
    isOwnStudentProfileOverride: profile?.isOwnStudentProfile ?? undefined,
  });
  const visibleTabs = useMemo(() => getVisibleStudentProfileTabs(access.canView), [access.canView]);

  const { activeTab, onTabChange, activeTabForQuery } = useStudentProfileTabState(
    studentId,
    visibleTabs,
    tabParam,
    router
  );

  const historyYear = currentMonth.getFullYear();
  const historyMonth = currentMonth.getMonth() + 1;

  useEffect(() => {
    if (activeTabForQuery !== "history") {
      return;
    }
    void refetch({ year: historyYear, month: historyMonth });
  }, [activeTabForQuery, historyYear, historyMonth, refetch]);

  useDocumentTitle(profile?.name, Translation.Dashboard.StudentProfile, "title");

  const contextValue = useMemo<StudentProfileContextValue>(
    () => ({
      studentId,
      profile: profile ?? null,
      loading,
      refetch,
    }),
    [studentId, profile, loading, refetch]
  );

  const { header, statusBadge } = useStudentProfilePresentation(profile, access, tStatus, t);

  const labelsBySection = useMemo<StudentProfilePageLabelsBySection>(
    () => ({
      shell: {
        title: t.title,
        loading: t.loading,
        notFoundTitle: t.notFoundTitle,
        notFoundDescription: t.notFoundDescription,
      },
      tabs: t.tabs,
    }),
    [t]
  );

  return {
    studentId,
    loadingState,
    profile,
    contextValue,
    header,
    statusBadge,
    visibleTabs,
    activeTab,
    labelsBySection,
    onTabChange,
  };
}

export type { StudentProfileContextValue, StudentProfileQueryData };
