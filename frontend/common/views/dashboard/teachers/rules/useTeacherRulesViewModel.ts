"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { teacherHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { useAppTranslation } from "@/shared/locale";

/**
 * TeacherRules ViewModel.
 *
 * Encapsulates the handbook-download orchestration (lazy `useQuery` gated by
 * a local `handbookRequested` flag + post-load side-effect that opens the URL)
 * and the localized labels built from `buildTeacherDashboardLabels`. Both tier
 * views consume the same flat shape; no viewport logic lives here.
 */

export interface TeacherRulesViewModel {
  readonly handbookLoading: boolean;
  readonly labels: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
  };
  readonly policyLabels: ReturnType<typeof buildTeacherDashboardLabels>["policy"];
  readonly actionLabels: ReturnType<typeof buildTeacherDashboardLabels>["actions"];
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
}

export type UseTeacherRulesViewModelProps = Record<string, never>;

export function useTeacherRulesViewModel(_props: Readonly<UseTeacherRulesViewModelProps> = {}): TeacherRulesViewModel {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const dashboardT = useAppTranslation().dashboardTranslations.admin;
  const tJoin = useAppTranslation().uiTranslations.meetingConfig.join;
  const labels = buildTeacherDashboardLabels(t, dashboardT, tJoin.emptyTeacher);

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

  return {
    handbookLoading,
    labels: {
      pageTitle: t.rules.pageTitle,
      pageSubtitle: t.rules.pageSubtitle,
    },
    policyLabels: labels.policy,
    actionLabels: labels.actions,
    onDownloadHandbook: () => {
      setHandbookRequested(true);
    },
    onContactCoordinator: () => {
      globalThis.location.href = "mailto:support@siraj.edu";
    },
  };
}
