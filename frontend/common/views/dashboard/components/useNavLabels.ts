"use client";

import { type DashboardNavigationLabels, Translation, useAppTranslation } from "@/shared/locale";

/**
 * Resolves a nav `labelKey` (a `keyof DashboardNavigationLabels`) to its
 * localized string. Compile-time safe — invalid keys fail tsgo.
 *
 * `nav` is a nested object on the labels interface (not a string), so callers
 * that need its inner navigational strings should access the sub-property
 * directly via a typed `labels.nav.logout` etc. rather than via this helper.
 */
export function useNavLabels(): (labelKey: keyof DashboardNavigationLabels) => string {
  const labels = useAppTranslation(Translation.Dashboard.CoreNav);

  return (labelKey: keyof DashboardNavigationLabels): string => {
    if (labelKey === "nav") {
      throw new Error("nav is a nested object, use specific sub-keys like labels.nav.logout");
    }
    return labels[labelKey];
  };
}
