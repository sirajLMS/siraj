import type { whatsappConfigs } from "@/backend/db/schema";

/**
 * Canonical type definitions for the `whatsapp_configs` entity — the
 * single-row store for WhatsApp Cloud API credentials managed from the
 * settings page.
 *
 * `SelectType` returns decrypted values for the encrypted columns
 * (`appSecret`, `accessToken`) — the `encryptedText` custom type decrypts at
 * the driver boundary. Those values must never be surfaced to clients
 * unmasked; API layers expose masked views instead.
 */
export type WhatsappConfigSelectType = typeof whatsappConfigs.$inferSelect;
export type WhatsappConfigInsertType = typeof whatsappConfigs.$inferInsert;

/**
 * Payload for creating/updating the configuration row from seeding or
 * bootstrap flows. DB-managed columns (`id`, `createdAt`, `updatedAt`) are
 * excluded — the driver applies their defaults on insert.
 */
export type WhatsappConfigSeedInput = Omit<WhatsappConfigInsertType, "id" | "createdAt" | "updatedAt">;
