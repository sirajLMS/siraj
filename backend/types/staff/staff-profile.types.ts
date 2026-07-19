import type { staffProfiles } from "@/backend/db/schema";
import type { AccountStatus, OverrideState } from "@/backend/enum";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

export type StaffProfileEntity = typeof staffProfiles.$inferSelect;
export type StaffProfileEntityInput = typeof staffProfiles.$inferInsert;

export type StaffProfileCreateResult = Pick<StaffProfileEntity, "id" | "userId" | "createdAt"> & {
  readonly phone: string | null;
  readonly status: AccountStatus;
};

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
  readonly status: AccountStatus;
  readonly roleSlug: string | null;
  readonly roleName: string | null;
  readonly hourlyRate: string | null;
  readonly rateCurrency: import("@/backend/enum").CurrencyCode | null;
}

export interface ManagerDirectoryFilters {
  readonly roleFilter?: string | null;
  readonly statusFilter?: string | null;
}

/** Lightweight row for staff autocomplete (`staffDirectory` query). */
export interface StaffDirectoryAutocompleteRow {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly email: string;
}

export interface OnboardingMetricsResult {
  readonly id: string;
  readonly activeStaff: number;
  readonly pendingApproval: number;
  readonly avgOnboardingDays: number;
}

export interface UpdateManagerProfileInput {
  phone?: string | null;
  status?: AccountStatus | null;
  hourlyRate?: string | null;
  rateCurrency?: import("@/backend/enum").CurrencyCode | null;
}

export interface StaffPermissionGroupReturnType {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
}

export interface StaffPermissionOverrideReturnType {
  readonly id: string;
  readonly permissionId: string;
  readonly permissionKey: string;
  readonly resource: string;
  readonly action: string;
  readonly state: OverrideState;
}
