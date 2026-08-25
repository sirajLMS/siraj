// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { SettingsTimezonesResultPothosObject } from "@/backend/graphql/pothos/system/timezones-settings.pothos";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { ReferenceDataService } from "@/backend/services";

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
