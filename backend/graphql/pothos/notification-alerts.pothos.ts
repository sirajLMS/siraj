import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { NotificationAlertsResult, SystemAlert } from "@/backend/types";

const SystemAlertRef = gqlSchemaBuilder.objectRef<SystemAlert>("SystemAlert");

export const SystemAlertPothosObject = SystemAlertRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    type: t.exposeString("type"),
    title: t.exposeString("title"),
    body: t.exposeString("body", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    severity: t.exposeString("severity"),
  }),
});

const NotificationAlertsResultRef = gqlSchemaBuilder.objectRef<NotificationAlertsResult>("NotificationAlertsResult");

export const NotificationAlertsResultPothosObject = NotificationAlertsResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    alerts: t.expose("alerts", { type: [SystemAlertPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    unreadCount: t.exposeInt("unreadCount"),
  }),
});
