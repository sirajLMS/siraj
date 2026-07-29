import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/i;

export const SITE_CONTENT_TYPES = ["page"] as const;

export type SiteContentType = (typeof SITE_CONTENT_TYPES)[number];

export const siteContentFormSchema = z.object({
  slug: z.string().trim().min(1).regex(SLUG_PATTERN),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
  isPublished: z.boolean(),
});

export type SiteContentFormValues = z.infer<typeof siteContentFormSchema>;
