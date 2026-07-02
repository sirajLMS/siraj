import { UserRepository } from "@/backend/db/repo";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  DemoLoginInput,
  LoginInput,
  LoginResponse,
  RefreshTokenResponse,
  UserPothosDefinition,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { AppPermissionPothosEnum } from "./enum.pothos";

const UserPothosObjectRef = gqlSchemaBuilder.objectRef<UserPothosDefinition>("User");

// User type
export const UserPothosObject = gqlSchemaBuilder.loadableObject<
  UserPothosDefinition | Error, // LoadResult
  string, // Key
  [], // Interfaces
  typeof UserPothosObjectRef // NameOrRef
>(UserPothosObjectRef, {
  load: async (ids: string[]) => UserRepository.loadByIds(ids),
  sort: user => user.id,
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    emailVerifiedAt: t.expose("emailVerifiedAt", {
      type: "DateTime",
      nullable: true,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    notificationCount: t.int({ resolve: () => 0 }),
    permissions: t.field({
      type: [AppPermissionPothosEnum],
      resolve: async user => PermissionsService.getUserContext(user.id).then(c => c.permissions),
    }),
    role: t.string({
      resolve: async user => PermissionsService.getUserContext(user.id).then(c => c.role),
    }),
  }),
});

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
