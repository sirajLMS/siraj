import { getFakerForIndex } from "@/backend/db/seeds/lib/faker-client";
import type { SeedConfig } from "@/backend/db/seeds/lib/seed-config";

export function buildAdminAuditDescription(config: SeedConfig, index: number): string {
  const faker = getFakerForIndex(config.fakerSeed, 8000 + index);
  return faker.lorem.sentence();
}

export const ADMIN_AUDIT_ACTIONS = [
  "USER_ROLE_CHANGED",
  "INVOICE_UPDATED",
  "STUDENT_STATUS_CHANGED",
  "PERMISSION_OVERRIDE_ADDED",
] as const;

export const AUDIT_ENTITY_TYPES = ["STUDENT", "INVOICE", "PAYMENT", "PERMISSION"] as const;

export const SITE_CONTENT_SPECS = [
  { slug: "terms", title: "Terms of Service", contentType: "page" },
  { slug: "privacy", title: "Privacy Policy", contentType: "page" },
  { slug: "help", title: "Help Center", contentType: "page" },
] as const;
