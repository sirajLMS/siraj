import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  NotificationChannelPothosObject,
  NotificationEventTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { NotificationAlertsResult, SystemAlert } from "@/backend/types";

const SystemAlertRef = gqlSchemaBuilder.objectRef<SystemAlert>("SystemAlert");

export const SystemAlertPothosObject = SystemAlertRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    deliveryId: t.exposeString("deliveryId", { nullable: true }),
    type: t.exposeString("type"),
    eventType: t.expose("eventType", { type: NotificationEventTypePothosObject, nullable: true }),
    channel: t.expose("channel", { type: NotificationChannelPothosObject, nullable: true }),
    metadata: t.expose("metadata", { type: "JSON", nullable: true }),
    title: t.exposeString("title"),
    body: t.exposeString("body", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    severity: t.exposeString("severity"),
    readAt: t.expose("readAt", { type: "DateTime", nullable: true }),
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
