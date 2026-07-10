import { UserRepository } from "@/backend/db/repo";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AppPermissionPothosEnum, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { UserReturnType } from "@/backend/types/auth/auth.types";

const UserPothosObjectRef = gqlSchemaBuilder.objectRef<UserReturnType>("User");

export const UserPothosObject = gqlSchemaBuilder.loadableObject<
  UserReturnType | Error,
  string,
  [],
  typeof UserPothosObjectRef
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
    displayCurrency: t.field({
      type: CurrencyCodePothosObject,
      nullable: true,
      resolve: user => user.displayCurrency,
    }),
    teacherId: t.string({
      nullable: true,
      resolve: async user => {
        const { TeacherPortalService } = await import("@/backend/services/teacher/teacher-portal.service");
        return TeacherPortalService.resolveTeacherIdForUser(user.id);
      },
    }),
    parentId: t.string({
      nullable: true,
      resolve: async user => {
        const { ParentPortalService } = await import("@/backend/services/parent/parent-portal.service");
        return ParentPortalService.resolveParentIdForUser(user.id);
      },
    }),
  }),
});
