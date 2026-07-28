import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  AuditAction,
  AuditEntityType,
  AuditLogFilterInput,
  AuditLogQueryResult,
  AuditLogReturnType,
} from "@/backend/types";

const AuditLogRef = gqlSchemaBuilder.objectRef<AuditLogReturnType>("AuditLog");

export const AuditLogPothosObject = AuditLogRef.implement({
  description: "An immutable audit log entry recording a system change.",
  fields: t => ({
    id: t.exposeString("id"),
    actorUserId: t.exposeString("actorUserId", { nullable: true }),
    actorType: t.exposeString("actorType"),
    entityType: t.exposeString("entityType"),
    entityId: t.exposeString("entityId"),
    action: t.exposeString("action"),
    description: t.exposeString("description", { nullable: true }),
    previousState: t.expose("previousState", { type: "JSON", nullable: true }),
    newState: t.expose("newState", { type: "JSON", nullable: true }),
    changes: t.expose("changes", { type: "JSON", nullable: true }),
    ipAddress: t.exposeString("ipAddress", { nullable: true }),
    userAgent: t.exposeString("userAgent", { nullable: true }),
    metadata: t.expose("metadata", { type: "JSON", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

const SettingsAuditLogsResultRef = gqlSchemaBuilder.objectRef<AuditLogQueryResult>("SettingsAuditLogsResult");

export const SettingsAuditLogsResultPothosObject = SettingsAuditLogsResultRef.implement({
  description: "Paginated audit log entries for the settings audit tab.",
  fields: t => ({
    id: t.string({
      description: "Synthetic identifier for Apollo cache normalization.",
      resolve: () => "settings-audit-logs",
    }),
    logs: t.expose("logs", { type: [AuditLogPothosObject] }),
    total: t.exposeInt("total"),
    hasMore: t.exposeBoolean("hasMore"),
  }),
});

export const SettingsAuditLogFilterPothosObject = gqlSchemaBuilder.inputRef("SettingsAuditLogFilter").implement({
  description: "Filter and pagination options for the settings audit log query.",
  fields: t => ({
    entityType: t.string({ required: false }),
    action: t.string({ required: false }),
    actorUserId: t.string({ required: false }),
    startDate: t.field({ type: "DateTime", required: false }),
    endDate: t.field({ type: "DateTime", required: false }),
    limit: t.int({ required: false, defaultValue: 50 }),
    offset: t.int({ required: false, defaultValue: 0 }),
  }),
});

function toAuditLogFilterInput(
  filter:
    | {
        entityType?: string | null;
        action?: string | null;
        actorUserId?: string | null;
        startDate?: Date | null;
        endDate?: Date | null;
        limit?: number | null;
        offset?: number | null;
      }
    | null
    | undefined
): AuditLogFilterInput {
  return {
    entityType: (filter?.entityType ?? undefined) as AuditEntityType | undefined,
    action: (filter?.action ?? undefined) as AuditAction | undefined,
    actorUserId: filter?.actorUserId ?? undefined,
    startDate: filter?.startDate ?? undefined,
    endDate: filter?.endDate ?? undefined,
    limit: filter?.limit ?? undefined,
    offset: filter?.offset ?? undefined,
  };
}

gqlSchemaBuilder.queryField("settingsAuditLogs", t =>
  t.field({
    type: SettingsAuditLogsResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_AUDIT_VIEW },
    description: "Returns paginated audit logs for the settings audit tab.",
    args: {
      filter: t.arg({ type: SettingsAuditLogFilterPothosObject, required: false }),
    },
    resolve: async (_root, args): Promise<AuditLogQueryResult> => {
      return AuditService.queryAuditLogs(toAuditLogFilterInput(args.filter));
    },
  })
);
