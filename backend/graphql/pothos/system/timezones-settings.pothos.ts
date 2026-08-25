import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type { SettingsTimezonesPaginatedResult, TimezoneSelectType } from "@/backend/types";

export const SettingsTimezoneRef = gqlSchemaBuilder.objectRef<TimezoneSelectType>("SettingsTimezone");

export const SettingsTimezonePothosObject = SettingsTimezoneRef.implement({
  fields: t => ({
    id: t.string({
      resolve: parent => String(parent.id),
    }),
    ianaId: t.exposeString("ianaId"),
    name: t.string({
      resolve: parent => parent.ianaId,
    }),
    baseOffsetMinutes: t.exposeInt("baseOffsetMinutes"),
    offsetMinutes: t.int({
      resolve: parent => parent.baseOffsetMinutes,
    }),
    isDstSupported: t.exposeBoolean("isDstSupported"),
  }),
});

export const SettingsTimezonesResultRef =
  gqlSchemaBuilder.objectRef<SettingsTimezonesPaginatedResult>("SettingsTimezonesResult");

export const SettingsTimezonesResultPothosObject = SettingsTimezonesResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [SettingsTimezonePothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});
