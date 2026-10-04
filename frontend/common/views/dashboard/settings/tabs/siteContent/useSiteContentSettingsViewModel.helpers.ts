import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";

interface SiteContentEntryFields {
  readonly id: string | null;
  readonly slug: string | null;
  readonly title: string | null;
  readonly body: string | null;
  readonly contentType: string | null;
  readonly isPublished: boolean | null;
}

function toSiteContentRow(entry: SiteContentEntryFields, index: number): SiteContentRow | null {
  if (!entry.slug || !entry.title) {
    return null;
  }

  return {
    id: entry.id ?? `${entry.slug}-${index}`,
    slug: entry.slug,
    title: entry.title,
    body: entry.body ?? "",
    contentType: entry.contentType ?? "page",
    isPublished: entry.isPublished ?? false,
  };
}

export function buildSiteContentRows(
  entries: readonly SiteContentEntryFields[] | null | undefined
): readonly SiteContentRow[] {
  return (entries ?? [])
    .map((entry, index) => toSiteContentRow(entry, index))
    .filter((row): row is SiteContentRow => row != null)
    .toSorted((left, right) => left.slug.localeCompare(right.slug));
}
