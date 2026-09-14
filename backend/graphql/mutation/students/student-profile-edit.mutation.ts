import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentProfileEditInputPothosObject, StudentProfilePothosObject } from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { StudentProfileService } from "@/backend/services";

gqlSchemaBuilder.mutationField("recordStudentProfileEdit", t =>
  t.field({
    type: StudentProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: StudentProfileEditInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return StudentProfileService.recordStudentProfileEdit(actorUserId, args.input, tErrors, ctx.locale);
    },
  })
);
