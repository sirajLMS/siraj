import type { staffProfiles } from "@/backend/db/schema";
import type { PageInfo } from "./pagination.types";

export type StaffProfileEntity = typeof staffProfiles.$inferSelect;
export type StaffProfileEntityInput = typeof staffProfiles.$inferInsert;

export type StaffProfileCreateResult = Pick<
  StaffProfileEntity,
  "id" | "userId" | "status" | "phone" | "skypeId" | "createdAt"
>;

export interface ManagerDirectoryResult {
  readonly rows: ManagerDirectoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}

export interface ManagerDirectoryRow {
  readonly id: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly status: string;
  readonly roleSlug: string | null;
  readonly roleName: string | null;
}
