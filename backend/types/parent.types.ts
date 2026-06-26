import type { parents } from "@/backend/db/schema";
import type { PageInfo } from "./pagination.types";

export type ParentEntity = typeof parents.$inferSelect;
export type ParentEntityInput = typeof parents.$inferInsert;

export type ParentCreateResult = Pick<
  ParentEntity,
  "id" | "userId" | "status" | "invoiceType" | "feeAmount" | "paymentMethod" | "currency" | "timezone" | "createdAt"
>;

export type ParentDirectoryMetrics = {
  activated: number;
  deactivated: number;
  regular: number;
  onLeave: number;
  suspended: number;
  onTrial: number;
};

export type ParentDirectoryRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  updatedAt: Date;
  unpaidInvoices: number;
};

export type ParentDirectoryResult = {
  metrics: ParentDirectoryMetrics;
  rows: ParentDirectoryRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};
