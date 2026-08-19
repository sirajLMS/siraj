import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UserPothosObject } from "@/backend/graphql/pothos";
import { UserService } from "@/backend/services";
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

      // R3-8: Reuse the user already loaded by createContext (ctx.safeUser)
      // instead of calling UserService.findById — eliminates 1 DB query per poll.
      // Preserve pre-optimization behavior: `me.role` defaults to USER (not ctx.role)
      // to avoid surfacing effective-role changes during impersonation/group-simulation.
      if (!ctx.safeUser) return null;
      return AuthUtils.toUserReturnType(ctx.safeUser);
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
      const user = await UserService.findById(args.id);
      return user ? AuthUtils.toUserReturnType(user) : null;
    },
  }),

  users: t.field({
    authScopes: { permission: AppPermission.STAFF_LIST },
    type: [UserPothosObject],
    args: {
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      limit: t.arg.int({ required: false, defaultValue: 50, description: "Max results (max 200)" }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_parent, args) => {
      const limit = Math.min(args.limit ?? 50, 200);
      const offset = args.offset ?? 0;
      const search = args.search?.trim() ?? null;
      return await UserService.findUsers({ limit, offset, search });
    },
  }),
}));
