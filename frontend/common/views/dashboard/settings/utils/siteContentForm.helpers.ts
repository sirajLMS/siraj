import {
  SITE_CONTENT_TYPES,
  type SiteContentFormValues,
  type SiteContentType,
} from "@/frontend/common/views/dashboard/settings/schemas/siteContentForm.schema";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

export function buildSiteContentFormDefaults(row: SiteContentRow | null): SiteContentFormValues {
  const contentType = row?.contentType ?? "page";
  return {
    slug: row?.slug ?? "",
    title: row?.title ?? "",
    body: row?.body ?? "",
    contentType: SITE_CONTENT_TYPES.includes(contentType as SiteContentType) ? contentType : "page",
    isPublished: row?.isPublished ?? false,
  };
}

export function resolveSiteContentFieldError(
  message: string | undefined,
  labels: SettingsSiteContentTabLabels,
  field: "slug" | "title" | "body" | "contentType"
): string | undefined {
  if (!message) {
    return undefined;
  }

  if (field === "slug") {
    return message.includes("Invalid") ? labels.slugInvalid : labels.slugRequired;
  }

  if (field === "title") {
    return labels.titleRequired;
  }

  if (field === "body") {
    return labels.bodyRequired;
  }

  return labels.contentTypeRequired;
}
