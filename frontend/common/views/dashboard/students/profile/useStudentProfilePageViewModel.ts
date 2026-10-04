"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useStudentHistoryStore } from "@/frontend/common/stores/studentHistoryStore";
import type {
  StudentProfileContextValue,
  StudentProfileQueryData,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import {
  getVisibleStudentProfileTabs,
  type StudentProfileTab,
} from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import type { StudentProfilePageLabelsBySection } from "@/frontend/common/views/dashboard/students/profile/types/studentProfilePage.types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  buildStudentProfileContextValue,
  buildStudentProfileLabelsBySection,
  type StudentProfileHeaderValues,
  type StudentProfileLoadingState,
  type StudentProfileStatusBadge,
} from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel.helpers";
import {
  useStudentProfileHistoryRefresh,
  useStudentProfileQueryState,
  useStudentProfileTabState,
} from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel.hooks";
import { useStudentProfilePresentation } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel.presentation";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

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

export function useStudentProfilePageViewModel(
  props: Readonly<UseStudentProfilePageViewModelProps>
): StudentProfilePageViewModel {
  const { studentId } = props;

  const t = useAppTranslation(Translation.Dashboard.StudentProfile);
  const tStatus = useAppTranslation(Translation.Dashboard.StudentStatus);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { year, month } = useStudentHistoryStore();
  const ensureInitialMonth = useStudentHistoryStore(state => state.ensureInitialMonth);
  const tabParam = searchParams.get("tab");

  const safeCurrentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month]);

  const { profile, loading, loadingState, refetch } = useStudentProfileQueryState(studentId, null, safeCurrentMonth);

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

  useEffect(() => {
    ensureInitialMonth();
  }, [ensureInitialMonth]);

  useStudentProfileHistoryRefresh(activeTabForQuery, safeCurrentMonth, refetch);

  useDocumentTitle(profile?.name, Translation.Dashboard.StudentProfile, "title");

  const contextValue = useMemo<StudentProfileContextValue>(
    () => buildStudentProfileContextValue(studentId, profile, loading, refetch),
    [studentId, profile, loading, refetch]
  );

  const { header, statusBadge } = useStudentProfilePresentation(profile, access, tStatus, t);

  const labelsBySection = useMemo<StudentProfilePageLabelsBySection>(() => buildStudentProfileLabelsBySection(t), [t]);

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
