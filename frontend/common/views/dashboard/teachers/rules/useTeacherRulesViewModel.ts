"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { teacherHandbookUrlQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import type { TeacherRulesLabelsBySection } from "@/frontend/common/views/dashboard/teachers/rules/types/teacherRules.types";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  readonly labelsBySection: TeacherRulesLabelsBySection;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
}

export type UseTeacherRulesViewModelProps = Record<string, never>;

export function useTeacherRulesViewModel(_props: Readonly<UseTeacherRulesViewModelProps> = {}): TeacherRulesViewModel {
  const t = useAppTranslation(Translation.Dashboard.TeacherDashboard);
  const dashboardT = useAppTranslation(Translation.Dashboard.Admin);
  const tJoin = useAppTranslation(Translation.Ui.MeetingConfig).join;
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
    labelsBySection: {
      shell: {
        pageTitle: t.rules.pageTitle,
        pageSubtitle: t.rules.pageSubtitle,
      },
      policy: labels.policy,
      actions: labels.actions,
    },
    onDownloadHandbook: () => {
      setHandbookRequested(true);
    },
    onContactCoordinator: () => {
      globalThis.location.href = "mailto:support@siraj.edu";
    },
  };
}
