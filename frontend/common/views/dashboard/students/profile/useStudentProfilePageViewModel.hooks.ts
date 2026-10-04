"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import {
  isStudentProfileTab,
  type StudentProfileTab,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import type { StudentProfileLoadingState } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel.helpers";
import type { useRouter } from "@/shared/i18n/navigation";

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

type StudentProfileRefetch = StudentProfileQueryState["refetch"];

export function useStudentProfileTabState(
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

  const [userSelectedTab, setUserSelectedTab] = useState<StudentProfileTab | null>(null);

  const activeTab = useMemo<StudentProfileTab | null>(() => {
    if (userSelectedTab !== null) {
      return userSelectedTab;
    }
    return resolveTab(tabParam);
  }, [userSelectedTab, resolveTab, tabParam]);

  useEffect(() => {
    if (activeTab && tabParam !== activeTab) {
      router.replace(`/students/${studentId}/profile?tab=${activeTab}`);
    }
  }, [activeTab, tabParam, studentId, router]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, nextTab: StudentProfileTab) => {
      setUserSelectedTab(nextTab);
      router.replace(`/students/${studentId}/profile?tab=${nextTab}`);
    },
    [router, studentId]
  );

  const activeTabForQuery = activeTab ?? resolveTab(tabParam);

  return { activeTab, visibleTabs, onTabChange: handleTabChange, activeTabForQuery };
}

export function useStudentProfileQueryState(
  studentId: string,
  activeTabForQuery: StudentProfileTab | null,
  currentMonth: Date | null
): StudentProfileQueryState {
  const year = activeTabForQuery === "history" && currentMonth ? currentMonth.getFullYear() : undefined;
  const month = activeTabForQuery === "history" && currentMonth ? currentMonth.getMonth() + 1 : undefined;

  const { data, loading, refetch } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: year ?? null, month: month ?? null, includeUpcomingClasses: true },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.studentProfile ?? undefined;

  let loadingState: StudentProfileLoadingState;
  if (loading && profile == null) {
    loadingState = "loading";
  } else if (profile == null) {
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

export function useStudentProfileHistoryRefresh(
  activeTabForQuery: StudentProfileTab | null,
  currentMonth: Date | null,
  refetch: StudentProfileRefetch
): void {
  const historyYear = currentMonth ? currentMonth.getFullYear() : 0;
  const historyMonth = currentMonth ? currentMonth.getMonth() + 1 : 0;

  useEffect(() => {
    if (activeTabForQuery !== "history") {
      return;
    }
    void refetch({ year: historyYear, month: historyMonth });
  }, [activeTabForQuery, historyYear, historyMonth, refetch]);
}
