// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  SettingsAuditLogFilterPothosObject,
  SettingsAuditLogsResultPothosObject,
  toAuditLogFilterInput,
} from "@/backend/graphql/pothos/system/settings-audit.pothos";
import { AuditService } from "@/backend/services";
import type { AuditLogQueryResult } from "@/backend/types";

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
