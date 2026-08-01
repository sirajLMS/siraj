import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";
import type {
  PaginationArgs,
  PaginationInput,
  SettingsTimezonesPaginatedResult,
  TimezoneEntity,
} from "@/backend/types";
import { PaginationArgs as PaginationArgsClass } from "@/backend/types";

function parsePaginationArgs(input: PaginationInput | null | undefined): PaginationArgs | null {
  if (!input) {
    return null;
  }
  return new PaginationArgsClass({
    first: input.first ?? null,
    skip: input.skip ?? null,
    after: input.after ?? null,
    before: input.before ?? null,
    last: input.last ?? null,
    page: input.page ?? null,
    maxCount: input.maxCount ?? null,
  });
}

const SettingsTimezoneRef = gqlSchemaBuilder.objectRef<TimezoneEntity>("SettingsTimezone");

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

const SettingsTimezonesResultRef =
  gqlSchemaBuilder.objectRef<SettingsTimezonesPaginatedResult>("SettingsTimezonesResult");

export const SettingsTimezonesResultPothosObject = SettingsTimezonesResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [SettingsTimezonePothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

gqlSchemaBuilder.queryField("settingsTimezones", t =>
  t.field({
    type: SettingsTimezonesResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_TIMEZONES_VIEW },

    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: (_root, args) => ReferenceDataService.listTimezonesPaginated(parsePaginationArgs(args.paginationArgs)),
  })
);
