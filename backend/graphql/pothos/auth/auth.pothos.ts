import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UserPothosObject } from "@/backend/graphql/pothos/users";
import type {
  AdminResetPasswordInput,
  AdminResetPasswordResult,
  ChangePasswordInput,
  DemoLoginInput,
  LoginInput,
  LoginResponse,
  RefreshTokenResponse,
} from "@/backend/types";

export const LoginInputPothosObject = gqlSchemaBuilder.inputRef<LoginInput>("LoginInput").implement({
  fields: t => ({
    email: t.field({
      type: "Email",
      required: true,
    }),
    password: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
  }),
});

export const DemoLoginInputPothosObject = gqlSchemaBuilder.inputRef<DemoLoginInput>("DemoLoginInput").implement({
  description: "Input for the demo fast login mutation.",
  fields: t => ({
    groupSlug: t.string({
      required: true,
      directives: { constraint: { maxLength: 255 } },
      description: "The unique slug of the permission group to authenticate as.",
    }),
  }),
});

export const ChangePasswordInputPothosObject = gqlSchemaBuilder
  .inputRef<ChangePasswordInput>("ChangePasswordInput")
  .implement({
    fields: t => ({
      currentPassword: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      newPassword: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      confirmPassword: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
    }),
  });

export const AdminResetPasswordInputPothosObject = gqlSchemaBuilder
  .inputRef<AdminResetPasswordInput>("AdminResetPasswordInput")
  .implement({
    fields: t => ({
      userId: t.id({ required: true }),
      newPassword: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      sendNotificationEmail: t.boolean({ required: false, defaultValue: true }),
    }),
  });

export const AdminResetPasswordResultPothosObject = gqlSchemaBuilder
  .objectRef<AdminResetPasswordResult>("AdminResetPasswordResult")
  .implement({
    fields: t => ({
      success: t.exposeBoolean("success"),
      emailSent: t.exposeBoolean("emailSent"),
      userId: t.exposeID("userId"),
      message: t.exposeString("message"),
    }),
  });

// Login response
export const LoginResponsePothosObject = gqlSchemaBuilder.objectRef<LoginResponse>("LoginResponse").implement({
  fields: t => ({
    token: t.exposeString("token"),
    // user: t.expose("user", { type: UserPothosObject }),
    user: t.loadable({
      type: UserPothosObject,
      load: (ids: string[], ctx) => UserPothosObject.getDataloader(ctx).loadMany(ids),
      resolve: loginResponse => loginResponse.user.id,
    }),
  }),
});

// Refresh token response
export const RefreshTokenResponsePothosObject = gqlSchemaBuilder
  .objectRef<RefreshTokenResponse>("RefreshTokenResponse")
  .implement({
    fields: t => ({
      token: t.exposeString("token"),
      user: t.loadable({
        type: UserPothosObject,
        load: (ids: string[], ctx) => UserPothosObject.getDataloader(ctx).loadMany(ids),
        resolve: loginResponse => loginResponse.user.id,
      }),
    }),
  });
