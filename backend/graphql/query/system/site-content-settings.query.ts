// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  assertCanViewSiteContentSettings,
  SiteContentEntryPothosObject,
} from "@/backend/graphql/pothos/system/site-content-settings.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { SiteContentService } from "@/backend/services";

gqlSchemaBuilder.queryField("siteContentEntries", t =>
  t.field({
    type: [SiteContentEntryPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewSiteContentSettings(ctx, tErrors);
      return SiteContentService.listSiteContent();
    },
    description: "Lists all site content entries for the Settings CMS tab.",
  })
);

gqlSchemaBuilder.queryField("siteContentEntry", t =>
  t.field({
    type: SiteContentEntryPothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewSiteContentSettings(ctx, tErrors);
      return SiteContentService.getSiteContentById(args.id);
    },
    description: "Fetches a single site content entry by ID.",
  })
);
