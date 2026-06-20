import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type SystemAlertDefinition = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: Date;
  severity: string;
};

const SystemAlertRef = gqlSchemaBuilder.objectRef<SystemAlertDefinition>("SystemAlert");

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

export type NotificationAlertsResultDefinition = {
  id: string;
  alerts: SystemAlertDefinition[];
  totalCount: number;
  unreadCount: number;
};

const NotificationAlertsResultRef =
  gqlSchemaBuilder.objectRef<NotificationAlertsResultDefinition>("NotificationAlertsResult");

export const NotificationAlertsResultPothosObject = NotificationAlertsResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    alerts: t.expose("alerts", { type: [SystemAlertPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    unreadCount: t.exposeInt("unreadCount"),
  }),
});
