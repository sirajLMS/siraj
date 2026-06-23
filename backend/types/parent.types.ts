import type { parents } from "@/backend/db/schema";

export type ParentEntity = typeof parents.$inferSelect;
export type ParentEntityInput = typeof parents.$inferInsert;

export type ParentCreateResult = Pick<
  ParentEntity,
  "id" | "userId" | "status" | "invoiceType" | "feeAmount" | "paymentMethod" | "currency" | "timezone" | "createdAt"
>;
