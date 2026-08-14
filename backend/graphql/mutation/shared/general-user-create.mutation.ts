import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { GeneralUserCreateInputPothosObject, GeneralUserCreateResultPothosObject } from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { GeneralUserOnboardingService } from "@/backend/services";

gqlSchemaBuilder.mutationField("createGeneralUser", t =>
  t.field({
    type: GeneralUserCreateResultPothosObject,
    description: "Create a new user with a non-specialized permission group",
    authScopes: {
      permission: AppPermission.STAFF_CREATE,
      notImpersonating: true,
    },
    args: {
      input: t.arg({ type: GeneralUserCreateInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await GeneralUserOnboardingService.createGeneralUser(
        userId,
        {
          name: args.input.name,
          email: args.input.email,
          password: args.input.password,
          phone: args.input.phone ?? null,
          groupSlug: args.input.groupSlug,
          status: args.input.status ?? undefined,
        },
        ctx.locale
      );
    },
  })
);
