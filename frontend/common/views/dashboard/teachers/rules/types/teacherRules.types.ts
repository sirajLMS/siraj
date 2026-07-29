import type { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";

export interface TeacherRulesShellLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
}

export type TeacherRulesPolicyLabels = ReturnType<typeof buildTeacherDashboardLabels>["policy"];

export type TeacherRulesActionLabels = ReturnType<typeof buildTeacherDashboardLabels>["actions"];

export interface TeacherRulesLabelsBySection {
  readonly shell: TeacherRulesShellLabels;
  readonly policy: TeacherRulesPolicyLabels;
  readonly actions: TeacherRulesActionLabels;
}
