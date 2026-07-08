import type {
  NotificationPreferenceReturnType,
  NotificationPreferenceUpdateInput,
} from "@/backend/types/notification-preferences.types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { NotificationChannelPothosObject, NotificationEventTypePothosObject } from "./enum.pothos";

const NotificationPreferenceRef =
  gqlSchemaBuilder.objectRef<NotificationPreferenceReturnType>("NotificationPreference");

export const NotificationPreferencePothosObject = NotificationPreferenceRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    channel: t.expose("channel", { type: NotificationChannelPothosObject }),
    eventType: t.expose("eventType", { type: NotificationEventTypePothosObject }),
    enabled: t.exposeBoolean("enabled"),
  }),
});

export const NotificationPreferenceInputPothosObject = gqlSchemaBuilder
  .inputRef<NotificationPreferenceUpdateInput>("NotificationPreferenceInput")
  .implement({
    fields: t => ({
      channel: t.field({ type: NotificationChannelPothosObject, required: true }),
      eventType: t.field({ type: NotificationEventTypePothosObject, required: true }),
      enabled: t.boolean({ required: true }),
    }),
  });
