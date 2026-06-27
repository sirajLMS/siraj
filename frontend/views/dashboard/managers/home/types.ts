import type { ManagerDirectoryMetrics as GeneratedManagerDirectoryMetrics } from "@/frontend/graphql/generated/gql/graphql-types";

export type ManagerRole = "admin" | "staff";

export type ManagerStatus = "active" | "offline";

export type ManagerRoleFilter = "all" | ManagerRole;

export type ManagerStatusFilter = "all" | ManagerStatus;

export type NonNullableManagerDirectoryMetrics = {
  [K in keyof Omit<GeneratedManagerDirectoryMetrics, "__typename">]: NonNullable<GeneratedManagerDirectoryMetrics[K]>;
};

export interface Manager {
  readonly id: string;
  readonly name: string;
  readonly role: ManagerRole;
  readonly status: ManagerStatus;
  readonly email: string;
  readonly skypeId: string;
  readonly phone: string;
  readonly avatarUrl: string;
}
