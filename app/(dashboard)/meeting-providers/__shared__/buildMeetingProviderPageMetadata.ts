import type { Metadata } from "next";

import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import type { getTranslations } from "@/shared/locale";

type Translations = ReturnType<typeof getTranslations>;

/**
 * Factory for meeting-provider page metadata.
 * @param mode - "create" or "edit"
 * @returns generateMetadata function for the page
 */
export function buildMeetingProviderPageMetadata(mode: "create" | "edit"): () => Promise<Metadata> {
  const selector = (t: Translations) =>
    mode === "create"
      ? t.dashboardTranslations.meetingProviders.createTitle
      : t.dashboardTranslations.meetingProviders.editTitle;
  return async () => buildTranslatedMetadata(selector);
}
