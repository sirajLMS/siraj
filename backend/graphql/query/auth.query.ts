import { UserRepository } from "@/backend/db/repo";
import { AppPermission } from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { UserPothosObject } from "../pothos";

gqlSchemaBuilder.queryFields(t => ({
  me: t.field({
    type: UserPothosObject,
    nullable: true,
    authScopes: {
      loggedIn: true,
    },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.user) return null;

      return await UserRepository.findById(ctx.user.id);
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
    resolve: async (_parent, args) => await UserRepository.findById(args.id),
  }),

  users: t.field({
    authScopes: { permission: AppPermission.STAFF_LIST },
    type: [UserPothosObject],
    resolve: async () => await UserRepository.findUsers({ limit: 50, offset: 0 }),
  }),
}));
