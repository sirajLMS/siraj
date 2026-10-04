import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  resolveChangePassword,
  resolveDemoLogin,
  resolveLogin,
  resolveLogout,
  resolveRefreshToken,
} from "@/backend/graphql/mutation/auth/auth.mutation.parts";
import {
  ChangePasswordInputPothosObject,
  DemoLoginInputPothosObject,
  LoginInputPothosObject,
  LoginResponsePothosObject,
  RefreshTokenResponsePothosObject,
} from "@/backend/graphql/pothos";

export { rotateTokensAndSession } from "@/backend/graphql/mutation/auth/auth.mutation.helpers";

gqlSchemaBuilder.mutationFields(t => ({
  login: t.field({
    type: LoginResponsePothosObject,
    args: {
      input: t.arg({ type: LoginInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => resolveLogin(args.input, ctx),
  }),

  /**
   * Special GraphQL endpoint for demo fast login.
   * This endpoint logs in a user using the provided permission group slug without requiring a password.
   * It is intended strictly for demonstration purposes and is secured by environment variables.
   *
   * @see `DemoAuthService.loginWithGroupSlug`
   * @see `SessionService.createSession`
   */
  demoLogin: t.field({
    type: LoginResponsePothosObject,
    description:
      "Special GraphQL endpoint for demo fast login. It bypasses password checks and logs in a user using the provided permission group slug. Intended strictly for demonstration purposes and secured by environment variables.",
    args: {
      input: t.arg({ type: DemoLoginInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => resolveDemoLogin(args.input, ctx),
  }),

  refreshToken: t.field({
    type: RefreshTokenResponsePothosObject,
    nullable: true,
    resolve: async (_parent, _args, ctx) => resolveRefreshToken(ctx),
  }),

  logout: t.field({
    type: "Boolean",
    authScopes: {
      loggedIn: true,
    },
    resolve: async (_parent, _args, ctx) => resolveLogout(ctx),
  }),

  changePassword: t.field({
    type: "Boolean",
    authScopes: {
      loggedIn: true,
    },
    args: {
      input: t.arg({ type: ChangePasswordInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => resolveChangePassword(args.input, ctx),
  }),
}));
