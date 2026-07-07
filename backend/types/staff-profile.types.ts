import type { staffProfiles } from "@/backend/db/schema";
import type { AccountStatus } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";

export type StaffProfileEntity = typeof staffProfiles.$inferSelect;
export type StaffProfileEntityInput = typeof staffProfiles.$inferInsert;

export type StaffProfileCreateResult = Pick<
  StaffProfileEntity,
  "id" | "userId" | "status" | "phone" | "skypeId" | "createdAt"
>;

export interface ManagerDirectoryResult {
  readonly id?: string;
  readonly metrics: ManagerDirectoryMetrics;
  readonly rows: ManagerDirectoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
}

export interface ManagerDirectoryMetrics {
  readonly id: string;
  readonly totalAdmin: number;
  readonly systemStaff: number;
  readonly activeNow: number;
  readonly alerts: number;
}

export interface ManagerDirectoryRow {
  readonly id: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly status: AccountStatus;
  readonly roleSlug: string | null;
  readonly roleName: string | null;
}

export interface ManagerDirectoryFilters {
  readonly roleFilter?: string | null;
  readonly statusFilter?: string | null;
}

export interface OnboardingMetricsResult {
  readonly id: string;
  readonly activeStaff: number;
  readonly pendingApproval: number;
  readonly avgOnboardingDays: number;
}

export interface UpdateManagerProfileInput {
  phone?: string | null;
  skypeId?: string | null;
  status?: AccountStatus | null;
}
