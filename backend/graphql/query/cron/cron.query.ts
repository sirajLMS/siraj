// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CronRunObject, CronScheduleObject, handleNotFoundError } from "@/backend/graphql/pothos/cron/cron.pothos";
import { CronService } from "@/backend/services";

gqlSchemaBuilder.queryField("cronSchedule", t =>
  t.field({
    type: CronScheduleObject,
    nullable: true,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: {
      id: t.arg.id({ required: true }),
    },
    description: "Fetch a single cron schedule by ID.",
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const result = await CronService.getSchedule(args.id);
      handleNotFoundError(result, args.id, tErrors);
      return result;
    },
  })
);

gqlSchemaBuilder.queryField("cronRun", t =>
  t.field({
    type: CronRunObject,
    nullable: true,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: {
      id: t.arg.id({ required: true }),
    },
    description: "Fetch a single cron run by ID.",
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const result = await CronService.getRunById(args.id);
      handleNotFoundError(result, args.id, tErrors);
      return result;
    },
  })
);
