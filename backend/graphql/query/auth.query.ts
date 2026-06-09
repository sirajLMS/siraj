import { UserRepository } from "@/backend/db/repo";
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
      if (!ctx.user) {
        return null;
      }

      return await UserRepository.findById(ctx.user.id);
    },
  }),

  user: t.field({
    type: UserPothosObject,
    nullable: true,
    authScopes: {
      loggedIn: true,
    },
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args) => await UserRepository.findById(args.id),
  }),

  users: t.field({
    type: [UserPothosObject],
    resolve: async () => await UserRepository.findAll(),
  }),
}));
