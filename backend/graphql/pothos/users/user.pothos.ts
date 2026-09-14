import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AccountStatusPothosObject,
  AppPermissionPothosEnum,
  CurrencyCodePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { ParentPortalService, PermissionsService, TeacherPortalService, UserService } from "@/backend/services";
import type { UserReturnType } from "@/backend/types";

export const UserPothosObjectRef = gqlSchemaBuilder.objectRef<UserReturnType>("User");

export const UserPothosObject = gqlSchemaBuilder.loadableObject<
  UserReturnType | Error,
  string,
  [],
  typeof UserPothosObjectRef
>(UserPothosObjectRef, {
  load: async (ids: string[]) => UserService.loadByIds(ids),
  sort: user => user.id,
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email", {
      authScopes: (parent, _args, ctx) => ctx.isSuperAdmin || ctx.user?.id === parent.id,
      unauthorizedResolver: () => null,
    }),
    emailVerifiedAt: t.expose("emailVerifiedAt", {
      type: "DateTime",
      nullable: true,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    phone: t.exposeString("phone", {
      nullable: true,
      authScopes: (parent, _args, ctx) => ctx.isSuperAdmin || ctx.user?.id === parent.id,
      unauthorizedResolver: () => null,
    }),
    status: t.expose("status", { type: AccountStatusPothosObject }),
    notificationCount: t.int({ resolve: () => 0 }),
    displayCurrency: t.field({
      type: CurrencyCodePothosObject,
      nullable: true,
      resolve: user => user.displayCurrency,
    }),
    permissions: t.field({
      type: [AppPermissionPothosEnum],
      resolve: async user => {
        const contexts = await PermissionsService.getUserContexts([user.id]);
        return contexts.get(user.id)?.permissions ?? [];
      },
    }),
    role: t.loadable({
      type: "String",
      load: async (ids: string[]) => {
        const contexts = await PermissionsService.getUserContexts(ids);
        return ids.map(id => contexts.get(id)?.role ?? "GUEST");
      },
      resolve: user => user.id,
    }),
    teacherId: t.loadable({
      type: "String",
      nullable: true,
      load: async (ids: string[]) => {
        const teacherIds = await TeacherPortalService.resolveTeacherIdsForUsers(ids);
        return ids.map(id => teacherIds.get(id) ?? null);
      },
      resolve: user => user.id,
    }),
    parentId: t.loadable({
      type: "String",
      nullable: true,
      load: async (ids: string[]) => {
        const parentIds = await ParentPortalService.resolveParentIdsForUsers(ids);
        return ids.map(id => parentIds.get(id) ?? null);
      },
      resolve: user => user.id,
    }),
  }),
});
