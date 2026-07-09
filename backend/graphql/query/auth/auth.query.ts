import { UserRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UserPothosObject } from "@/backend/graphql/pothos";
import { AuthUtils } from "@/backend/utils";

gqlSchemaBuilder.queryFields(t => ({
  me: t.field({
    type: UserPothosObject,
    nullable: true,
    authScopes: {
      loggedIn: true,
    },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.user) return null;

      const user = await UserRepository.findById(ctx.user.id);
      return user ? AuthUtils.toUserReturnType(user) : null;
    },
  }),

  user: t.field({
    type: UserPothosObject,
    nullable: true,
    authScopes: {
      permission: AppPermission.STAFF_EDIT,
    },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args) => {
      const user = await UserRepository.findById(args.id);
      return user ? AuthUtils.toUserReturnType(user) : null;
    },
  }),

  users: t.field({
    authScopes: { permission: AppPermission.STAFF_LIST },
    type: [UserPothosObject],
    args: {
      limit: t.arg.int({ required: false, defaultValue: 50, description: "Max results (max 200)" }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, args) => {
      const limit = Math.min(args.limit ?? 50, 200);
      const offset = args.offset ?? 0;
      return await UserRepository.findUsers({ limit, offset });
    },
  }),
}));
