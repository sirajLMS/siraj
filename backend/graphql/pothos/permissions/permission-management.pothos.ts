import { PermissionManagementRepository } from "@/backend/db/repo";
import { AppPermission, OverrideState } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { OverrideStatePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import type {
  GroupUserEntity,
  GroupWithPermissionIds,
  PermissionEntity,
  UserOverrideEntity,
  UserOverrideReturnType,
} from "@/backend/types";

/**
 * Type guard to validate if a string is a valid OverrideState.
 * @param state The state value to validate.
 * @returns True if the state is a valid OverrideState, false otherwise.
 */
function isOverrideState(state: string): state is OverrideState {
  return Object.values(OverrideState).includes(state as OverrideState);
}

/**
 * Safely maps user overrides to include only valid OverrideState values.
 * @param overrides Array of user override objects.
 * @returns Array of user overrides with validated OverrideState values.
 * @throws Error if any state is not a valid OverrideState.
 */
function mapUserOverridesSafely(overrides: UserOverrideEntity[]): UserOverrideReturnType[] {
  return overrides.map(o => {
    if (!isOverrideState(o.state)) {
      throw new Error(`Invalid OverrideState value: ${o.state}`);
    }
    return { ...o, state: o.state };
  });
}

let groupUsersCache: Map<string, GroupUserEntity[]> | null = null;

function clearGroupUsersCache() {
  groupUsersCache = null;
}

async function getGroupUsersMap(): Promise<Map<string, GroupUserEntity[]>> {
  groupUsersCache ??= await PermissionManagementRepository.listAllGroupUsers();
  return groupUsersCache;
}

// ─── Object Types ─────────────────────────────────────────────────────────────

export const PermissionObject = gqlSchemaBuilder.objectRef<PermissionEntity>("Permission").implement({
  fields: t => ({
    id: t.exposeString("id"),
    key: t.exposeString("key"),
    resource: t.exposeString("resource"),
    action: t.exposeString("action"),
    description: t.exposeString("description"),
    category: t.exposeString("category"),
    isSystem: t.exposeBoolean("isSystem"),
  }),
});

export const GroupUserObject = gqlSchemaBuilder.objectRef<GroupUserEntity>("GroupUser").implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
  }),
});

export const PermissionGroupObject = gqlSchemaBuilder.objectRef<GroupWithPermissionIds>("PermissionGroup").implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.expose("name", { type: "LocalizedString" }),
    slug: t.exposeString("slug"),
    description: t.expose("description", { type: "LocalizedString", nullable: true }),
    isSystem: t.exposeBoolean("isSystem"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    permissionIds: t.exposeStringList("permissionIds"),
    assignedUsers: t.field({
      type: [GroupUserObject],
      resolve: async group => {
        const map = await getGroupUsersMap();
        return map.get(group.id) ?? [];
      },
    }),
  }),
});

export const UserOverrideObject = gqlSchemaBuilder.objectRef<UserOverrideReturnType>("UserOverride").implement({
  fields: t => ({
    permissionId: t.exposeString("permissionId"),
    state: t.expose("state", { type: OverrideStatePothosObject }),
    assignedBy: t.exposeString("assignedByUserId", { nullable: true }),
  }),
});

// ─── Input Types ──────────────────────────────────────────────────────────────

const CreatePermissionGroupInput = gqlSchemaBuilder.inputType("CreatePermissionGroupInput", {
  fields: t => ({
    name: t.field({ type: "LocalizedString", required: true }),
    description: t.field({ type: "LocalizedString", required: false }),
    permissionIds: t.stringList({ required: true, directives: { constraint: { maxItems: 100 } } }),
  }),
});

const UpdatePermissionGroupInput = gqlSchemaBuilder.inputType("UpdatePermissionGroupInput", {
  fields: t => ({
    groupId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    name: t.field({ type: "LocalizedString", required: false }),
    description: t.field({ type: "LocalizedString", required: false }),
    permissionIds: t.stringList({ required: false, directives: { constraint: { maxItems: 100 } } }),
  }),
});

const AssignPermissionGroupToUserInput = gqlSchemaBuilder.inputType("AssignPermissionGroupToUserInput", {
  fields: t => ({
    userId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    groupId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
  }),
});

const RevokePermissionGroupFromUserInput = gqlSchemaBuilder.inputType("RevokePermissionGroupFromUserInput", {
  fields: t => ({
    userId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    groupId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
  }),
});

const UserOverrideInputRef = gqlSchemaBuilder.inputType("UserOverrideInput", {
  fields: t => ({
    permissionId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    state: t.field({ type: OverrideStatePothosObject, required: true }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryFields(t => ({
  permissions: t.field({
    type: [PermissionObject],
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    description: "List all permission catalog entries.",
    resolve: async (_root, _args, ctx) => PermissionManagementService.listPermissions(ctx.user?.id || "", ctx.locale),
  }),
  permissionGroups: t.field({
    type: [PermissionGroupObject],
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    description: "List all permission groups with their permission IDs.",
    resolve: async (_root, _args, ctx) => {
      clearGroupUsersCache();
      return PermissionManagementService.listGroups(ctx.user?.id || "", ctx.locale);
    },
  }),
  permissionGroup: t.field({
    type: PermissionGroupObject,
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    description: "Fetch a single permission group by ID.",
    resolve: async (_root, args, ctx) => PermissionManagementService.getGroup(ctx.user?.id || "", args.id, ctx.locale),
  }),
  userPermissionGroups: t.stringList({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    description: "Return group IDs assigned to a user.",
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.listGroupsForUser(ctx.user?.id || "", args.userId, ctx.locale),
  }),
  userOverrides: t.field({
    type: [UserOverrideObject],
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    description: "List overrides for a user.",
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.listUserOverrides(ctx.user?.id || "", args.userId, ctx.locale).then(overrides =>
        mapUserOverridesSafely(overrides)
      ),
  }),
  effectiveUserPermissions: t.stringList({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    description: "Return effective permissions for a user, combining groups and overrides.",
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.getEffectiveUserPermissions(ctx.user?.id || "", args.userId, ctx.locale),
  }),
}));

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationFields(t => ({
  createPermissionGroup: t.field({
    type: PermissionGroupObject,
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { input: t.arg({ type: CreatePermissionGroupInput, required: true }) },
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.createGroup(
        ctx.user?.id || "",
        {
          name: args.input.name,
          description: args.input.description ?? null,
          permissionIds: args.input.permissionIds,
        },
        ctx.locale
      ),
  }),
  updatePermissionGroup: t.field({
    type: PermissionGroupObject,
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { input: t.arg({ type: UpdatePermissionGroupInput, required: true }) },
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.updateGroup(
        ctx.user?.id || "",
        {
          groupId: args.input.groupId,
          name: args.input.name ?? undefined,
          description: args.input.description ?? undefined,
          permissionIds: args.input.permissionIds ?? undefined,
        },
        ctx.locale
      ),
  }),
  deletePermissionGroup: t.boolean({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: { groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    resolve: async (_root, args, ctx) => {
      await PermissionManagementService.deleteGroup(ctx.user?.id || "", args.groupId, ctx.locale);
      return true;
    },
  }),
  assignPermissionGroupToUser: t.boolean({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_ASSIGN, notImpersonating: true },
    args: { input: t.arg({ type: AssignPermissionGroupToUserInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      clearGroupUsersCache();
      await PermissionManagementService.assignGroupToUser(
        ctx.user?.id || "",
        { userId: args.input.userId, groupId: args.input.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  revokePermissionGroupFromUser: t.boolean({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_ASSIGN, notImpersonating: true },
    args: { input: t.arg({ type: RevokePermissionGroupFromUserInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      clearGroupUsersCache();
      await PermissionManagementService.revokeGroupFromUser(
        ctx.user?.id || "",
        { userId: args.input.userId, groupId: args.input.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  bulkAssignUsersToGroup: t.boolean({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_ASSIGN, notImpersonating: true },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      userIds: t.arg.stringList({ required: true, directives: { constraint: { maxItems: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      clearGroupUsersCache();
      await PermissionManagementService.bulkAssignUsersToGroup(
        ctx.user?.id || "",
        { userIds: args.userIds, groupId: args.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  bulkRevokeUsersFromGroup: t.boolean({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_ASSIGN, notImpersonating: true },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      userIds: t.arg.stringList({ required: true, directives: { constraint: { maxItems: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      clearGroupUsersCache();
      await PermissionManagementService.bulkRevokeUsersFromGroup(
        ctx.user?.id || "",
        { userIds: args.userIds, groupId: args.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  updateUserOverrides: t.boolean({
    authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
    args: {
      userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      overrides: t.arg({ type: [UserOverrideInputRef], required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const formattedOverrides = args.overrides.map(o => ({
        permissionId: o.permissionId,
        state: o.state,
      }));
      await PermissionManagementService.updateUserOverrides(
        ctx.user?.id || "",
        { userId: args.userId, overrides: formattedOverrides },
        ctx.locale
      );
      return true;
    },
  }),
}));
