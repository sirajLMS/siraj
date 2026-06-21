import { PermissionManagementRepository } from "@/backend/db/repo";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import type { GroupUserEntity, GroupWithPermissionIds, PermissionEntity, UserOverrideEntity } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

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
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    isSystem: t.exposeBoolean("isSystem"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    permissionIds: t.exposeStringList("permissionIds"),
    assignedUsers: t.field({
      type: [GroupUserObject],
      resolve: async group => PermissionManagementRepository.listUsersInGroup(group.id),
    }),
  }),
});

export const UserOverrideObject = gqlSchemaBuilder.objectRef<UserOverrideEntity>("UserOverride").implement({
  fields: t => ({
    permissionId: t.exposeString("permissionId"),
    state: t.exposeString("state"),
    assignedBy: t.exposeString("assignedByUserId", { nullable: true }),
  }),
});

// ─── Input Types ──────────────────────────────────────────────────────────────

const CreatePermissionGroupInput = gqlSchemaBuilder.inputType("CreatePermissionGroupInput", {
  fields: t => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    permissionIds: t.stringList({ required: true }),
  }),
});

const UpdatePermissionGroupInput = gqlSchemaBuilder.inputType("UpdatePermissionGroupInput", {
  fields: t => ({
    groupId: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    permissionIds: t.stringList({ required: false }),
  }),
});

const AssignPermissionGroupToUserInput = gqlSchemaBuilder.inputType("AssignPermissionGroupToUserInput", {
  fields: t => ({
    userId: t.string({ required: true }),
    groupId: t.string({ required: true }),
  }),
});

const RevokePermissionGroupFromUserInput = gqlSchemaBuilder.inputType("RevokePermissionGroupFromUserInput", {
  fields: t => ({
    userId: t.string({ required: true }),
    groupId: t.string({ required: true }),
  }),
});

const UserOverrideInputRef = gqlSchemaBuilder.inputType("UserOverrideInput", {
  fields: t => ({
    permissionId: t.string({ required: true }),
    state: t.string({ required: true }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryFields(t => ({
  permissions: t.field({
    type: [PermissionObject],
    description: "List all permission catalog entries.",
    resolve: async (_root, _args, ctx) => PermissionManagementService.listPermissions(ctx.user?.id || "", ctx.locale),
  }),
  permissionGroups: t.field({
    type: [PermissionGroupObject],
    description: "List all permission groups with their permission IDs.",
    resolve: async (_root, _args, ctx) => PermissionManagementService.listGroups(ctx.user?.id || "", ctx.locale),
  }),
  permissionGroup: t.field({
    type: PermissionGroupObject,
    args: { id: t.arg.string({ required: true }) },
    description: "Fetch a single permission group by ID.",
    resolve: async (_root, args, ctx) => PermissionManagementService.getGroup(ctx.user?.id || "", args.id, ctx.locale),
  }),
  userPermissionGroups: t.stringList({
    args: { userId: t.arg.string({ required: true }) },
    description: "Return group IDs assigned to a user.",
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.listGroupsForUser(ctx.user?.id || "", args.userId, ctx.locale),
  }),
  userOverrides: t.field({
    type: [UserOverrideObject],
    args: { userId: t.arg.string({ required: true }) },
    description: "List overrides for a user.",
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.listUserOverrides(ctx.user?.id || "", args.userId, ctx.locale),
  }),
  effectiveUserPermissions: t.stringList({
    args: { userId: t.arg.string({ required: true }) },
    description: "Return effective permissions for a user, combining groups and overrides.",
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.getEffectiveUserPermissions(ctx.user?.id || "", args.userId, ctx.locale),
  }),
}));

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationFields(t => ({
  createPermissionGroup: t.field({
    type: PermissionGroupObject,
    args: { input: t.arg({ type: CreatePermissionGroupInput, required: true }) },
    resolve: async (_root, args, ctx) =>
      PermissionManagementService.createGroup(
        ctx.user?.id || "",
        {
          name: args.input.name,
          description: args.input.description ?? undefined,
          permissionIds: args.input.permissionIds,
        },
        ctx.locale
      ),
  }),
  updatePermissionGroup: t.field({
    type: PermissionGroupObject,
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
    args: { groupId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      await PermissionManagementService.deleteGroup(ctx.user?.id || "", args.groupId, ctx.locale);
      return true;
    },
  }),
  assignPermissionGroupToUser: t.boolean({
    args: { input: t.arg({ type: AssignPermissionGroupToUserInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      await PermissionManagementService.assignGroupToUser(
        ctx.user?.id || "",
        { userId: args.input.userId, groupId: args.input.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  revokePermissionGroupFromUser: t.boolean({
    args: { input: t.arg({ type: RevokePermissionGroupFromUserInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      await PermissionManagementService.revokeGroupFromUser(
        ctx.user?.id || "",
        { userId: args.input.userId, groupId: args.input.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  bulkAssignUsersToGroup: t.boolean({
    args: {
      groupId: t.arg.string({ required: true }),
      userIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await PermissionManagementService.bulkAssignUsersToGroup(
        ctx.user?.id || "",
        { userIds: args.userIds, groupId: args.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  bulkRevokeUsersFromGroup: t.boolean({
    args: {
      groupId: t.arg.string({ required: true }),
      userIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await PermissionManagementService.bulkRevokeUsersFromGroup(
        ctx.user?.id || "",
        { userIds: args.userIds, groupId: args.groupId },
        ctx.locale
      );
      return true;
    },
  }),
  updateUserOverrides: t.boolean({
    args: {
      userId: t.arg.string({ required: true }),
      overrides: t.arg({ type: [UserOverrideInputRef], required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const formattedOverrides = args.overrides.map(o => {
        if (o.state !== "GRANTED" && o.state !== "DENIED") {
          throw new Error("Invalid override state. Must be 'GRANTED' or 'DENIED'.");
        }
        const state = o.state === "GRANTED" ? ("GRANTED" as const) : ("DENIED" as const);
        return {
          permissionId: o.permissionId,
          state,
        };
      });
      await PermissionManagementService.updateUserOverrides(
        ctx.user?.id || "",
        { userId: args.userId, overrides: formattedOverrides },
        ctx.locale
      );
      return true;
    },
  }),
}));
