/**
 * Shared types for auth simulation helpers used by both
 * impersonation.service.ts and permission-group-simulation.service.ts.
 */

export type SimulationSessionOwnership = {
  rawSessionId: string;
  actorUserId: string;
};

export type SimulationAuditLogParams = {
  actorUserId: string;
  targetUserId: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress?: string | null;
};
