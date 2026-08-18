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

/**
 * GraphQL-specific upsert input for site content.
 * Omits `updatedByUserId` (resolved from the authenticated user context).
 */
export type SiteContentUpsertGraphQLInput = Omit<SiteContentUpsertInput, "updatedByUserId">;
