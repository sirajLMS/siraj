import type { siteContent } from "@/backend/db/schema/storage/site-content";

export type SiteContentSelectType = typeof siteContent.$inferSelect;
export type SiteContentInsertType = typeof siteContent.$inferInsert;

export type SiteContentUpsertInput = {
  readonly slug: string;
  readonly title: string;
  readonly body: string;
  readonly contentType: string;
  readonly isPublished: boolean;
  readonly updatedByUserId: string;
};
