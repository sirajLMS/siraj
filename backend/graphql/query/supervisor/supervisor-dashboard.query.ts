import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SupervisorDashboardPothosObject } from "@/backend/graphql/pothos/supervisor/supervisor-dashboard.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { SupervisorDashboardService } from "@/backend/services";

gqlSchemaBuilder.queryField("supervisorDashboard", t =>
  t.field({
    type: SupervisorDashboardPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return SupervisorDashboardService.getDashboard(actorUserId, ctx.locale);
    },
  })
);
