import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  WhatsappGroupJoinRequestPothosObject,
  WhatsappGroupMessagesResultPothosObject,
  WhatsappGroupPothosObject,
  WhatsappGroupsResultPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-groups.pothos";
import { WhatsappGroupsService } from "@/backend/services";
import type { UserPermissionContext, WhatsappGroupMessagesListInput, WhatsappGroupsListInput } from "@/backend/types";

/**
 * WhatsApp groups workspace read surface: the per-account groups list, a
 * single group row, a group's paginated message thread, and the pending
 * join-request list (live from Meta). All fields are gated on
 * `WHATSAPP_GROUPS_VIEW` at both the resolver (authScopes) and service
 * layers; the already-populated UserPermissionContext from ctx is handed to
 * the service so no extra permission-context round-trip happens per request.
 */

function permissionContext(ctx: BaseContext): UserPermissionContext {
  return {
    permissions: ctx.permissions,
    permissionGroups: ctx.permissionGroups,
    isSuperAdmin: ctx.isSuperAdmin,
    role: ctx.role,
  };
}

gqlSchemaBuilder.queryFields(t => ({
  whatsappGroups: t.field({
    type: WhatsappGroupsResultPothosObject,
    description:
      "Paginated groups list for the workspace; spans all accounts when `accountId` is omitted, filtered by group subject with `search`.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_VIEW },
    args: {
      accountId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 128 } } }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const input: WhatsappGroupsListInput = {
        accountId: args.accountId ?? null,
        search: args.search ?? undefined,
        paginationArgs: args.pagination ?? null,
      };
      return WhatsappGroupsService.listGroups(permissionContext(ctx), tErrors, input);
    },
  }),

  whatsappGroup: t.field({
    type: WhatsappGroupPothosObject,
    description:
      "One group row for the workspace: subject, description, approval mode, participant rollups and sync state.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_VIEW },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappGroupsService.getGroup(permissionContext(ctx), tErrors, { groupId: args.groupId });
    },
  }),

  whatsappGroupMessages: t.field({
    type: WhatsappGroupMessagesResultPothosObject,
    description: "Paginated message thread for one group, newest-first with the thread's total count.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_VIEW },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const input: WhatsappGroupMessagesListInput = {
        groupId: args.groupId,
        paginationArgs: args.pagination ?? null,
      };
      return WhatsappGroupsService.listGroupMessages(permissionContext(ctx), tErrors, input);
    },
  }),

  whatsappGroupJoinRequests: t.field({
    type: [WhatsappGroupJoinRequestPothosObject],
    description: "Pending join requests for one group, listed live from Meta with the owning account's credentials.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_VIEW },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappGroupsService.listJoinRequests(permissionContext(ctx), tErrors, { groupId: args.groupId });
    },
  }),
}));
