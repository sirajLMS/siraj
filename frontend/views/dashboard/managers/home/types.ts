import type { ManagerDirectoryMetrics as GeneratedManagerDirectoryMetrics } from "@/frontend/graphql/generated/gql/graphql-types";

export type { ManagerRoleFilter, ManagerStatusFilter } from "@/frontend/types/shared.types";

export type ManagerRole = "admin" | "staff";

export type ManagerStatus = "active" | "offline";

export type NonNullableManagerDirectoryMetrics = {
  [K in keyof Omit<GeneratedManagerDirectoryMetrics, "__typename">]: NonNullable<GeneratedManagerDirectoryMetrics[K]>;
};

export interface Manager {
  readonly userId: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly role: ManagerRole;
  readonly status: ManagerStatus;
  readonly email: string;
  readonly phone: string;
  readonly avatarUrl: string;
  readonly targetIsSuperAdmin: boolean;
}
