import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AvailabilitySearchInputPothosObject,
  AvailabilitySearchResultPothosObject,
} from "@/backend/graphql/pothos/scheduling/availability-search.pothos";
import { AvailabilitySearchService } from "@/backend/services/schedule/availability-search.service";

gqlSchemaBuilder.queryFields(t => ({
  searchTeacherAvailability: t.field({
    type: AvailabilitySearchResultPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: AvailabilitySearchInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      if (!ctx.user) {
        throw new Error(tErrors.unauthorized);
      }
      return AvailabilitySearchService.searchAvailability(ctx.user.id, args.input, tErrors);
    },
  }),
}));
