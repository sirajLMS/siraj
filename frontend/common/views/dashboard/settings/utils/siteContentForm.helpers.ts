import {
  SITE_CONTENT_TYPES,
  type SiteContentFormValues,
  type SiteContentType,
} from "@/frontend/common/views/dashboard/settings/schemas/siteContentForm.schema";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

const VALID_CONTENT_TYPES = new Set<string>(SITE_CONTENT_TYPES);

function isSiteContentType(value: string): value is SiteContentType {
  return VALID_CONTENT_TYPES.has(value);
}

export function buildSiteContentFormDefaults(row: SiteContentRow | null): SiteContentFormValues {
  const contentType = row?.contentType ?? "page";
  return {
    slug: row?.slug ?? "",
    title: row?.title ?? "",
    body: row?.body ?? "",
    contentType: isSiteContentType(contentType) ? contentType : "page",
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
