import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import type { TeacherRulesViewModel } from "@/frontend/common/views/dashboard/teachers/rules/useTeacherRulesViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

export function buildTeacherRulesViewModel(
  locale: AppLocale,
  overrides: Partial<TeacherRulesViewModel> = {}
): TeacherRulesViewModel {
  const t = readTranslation(Translation.Dashboard.TeacherDashboard, locale);
  const dashboardT = readTranslation(Translation.Dashboard.Admin, locale);
  const tJoin = readTranslation(Translation.Ui.MeetingConfig, locale).join;
  const labels = buildTeacherDashboardLabels(t, dashboardT, tJoin.emptyTeacher);

  return {
    handbookLoading: false,
    labelsBySection: {
      shell: {
        pageTitle: t.rules.pageTitle,
        pageSubtitle: t.rules.pageSubtitle,
      },
      policy: labels.policy,
      actions: labels.actions,
    },
    onDownloadHandbook: () => {},
    onContactCoordinator: () => {},
    ...overrides,
  };
}
