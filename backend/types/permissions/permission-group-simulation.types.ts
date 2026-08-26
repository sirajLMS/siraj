export type StartPermissionGroupSimulationInput = {
  actorUserId: string;
  groupSlug: string;
  sessionId: string;
  ipAddress?: string | null;
};

export type PermissionGroupSimulationStatusReturnType = {
  isActive: boolean;
  groupSlug?: string;
  groupName?: string;
  startedAt?: Date;
  expiresAt?: Date;
};

export type StartPermissionGroupSimulationReturnType = {
  token: string;
  expiresAt: Date;
  groupSlug: string;
};

export type EndPermissionGroupSimulationReturnType = {
  token: string;
};

export type GroupSimulationAuditAction = "GROUP_SIMULATION_START" | "GROUP_SIMULATION_END";

export type SimulatablePermissionGroupReturnType = {
  slug: string;
  name: string;
  description: string | null;
};
