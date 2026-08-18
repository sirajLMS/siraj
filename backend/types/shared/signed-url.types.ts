import type { signedUrls } from "@/backend/db/schema";

export type SignedUrlSelectType = typeof signedUrls.$inferSelect;
export type SignedUrlInsertType = typeof signedUrls.$inferInsert;
