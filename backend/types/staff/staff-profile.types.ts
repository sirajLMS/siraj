import type { staffProfiles } from "@/backend/db/schema";
import type { AccountStatus, OverrideState } from "@/backend/enum";
import type { PageInfo } from "@/backend/types";

type StaffProfileSelectType = typeof staffProfiles.$inferSelect;
export type StaffProfileInsertType = typeof staffProfiles.$inferInsert;

export type StaffProfileCreateResult = Pick<StaffProfileSelectType, "id" | "userId" | "createdAt"> & {
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
  readonly rateCurrency: import("@/shared/constants/currency.enum").CurrencyCode | null;
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
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: AccountStatus | null;
  hourlyRate?: string | null;
  rateCurrency?: import("@/shared/constants/currency.enum").CurrencyCode | null;
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

// R1/R4 NOTE: ManagerProfileUpdateInput uses an `*IsSet` boolean pattern to
// distinguish "field not provided" from "field explicitly set to null". This is
// a DIFFERENT purpose from staff/staff-profile.types.ts UpdateManagerProfileInput
// (which uses standard optional fields). Both are intentionally kept; NOT a duplicate.
export interface ManagerProfileUpdateInput {
  readonly phone?: string | null;
  readonly phoneIsSet?: boolean;
  readonly status?: string | null;
  readonly statusIsSet?: boolean;
  readonly hourlyRate?: string | null;
  readonly hourlyRateIsSet?: boolean;
  readonly rateCurrency?: string | null;
  readonly rateCurrencyIsSet?: boolean;
}
