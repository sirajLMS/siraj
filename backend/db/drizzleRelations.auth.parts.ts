import type { RelationsBuilderForSchema } from "@/backend/db/drizzleRelations.helpers";

const userRelations = (r: RelationsBuilderForSchema) => ({
  users: {
    sessions: r.many.sessions({
      from: r.users.id,
      to: r.sessions.userId,
    }),
    userPaymentMethods: r.many.userPaymentMethods({
      from: r.users.id,
      to: r.userPaymentMethods.userId,
    }),
    verifiedPaymentMethods: r.many.userPaymentMethods({
      from: r.users.id,
      to: r.userPaymentMethods.verifiedByUserId,
    }),
    userPermissionGroups: r.many.userPermissionGroups({
      from: r.users.id,
      to: r.userPermissionGroups.userId,
    }),
    permissionGroups: r.many.permissionGroups({
      from: r.users.id.through(r.userPermissionGroups.userId),
      to: r.permissionGroups.id.through(r.userPermissionGroups.groupId),
    }),
    teacher: r.one.teachers({
      from: r.users.id,
      to: r.teachers.userId,
    }),
    parent: r.one.parents({
      from: r.users.id,
      to: r.parents.userId,
    }),
    staffProfile: r.one.staffProfiles({
      from: r.users.id,
      to: r.staffProfiles.userId,
    }),
    createdPermissionGroups: r.many.permissionGroups({
      from: r.users.id,
      to: r.permissionGroups.createdByUserId,
    }),
    uploadedResources: r.many.learningResources({
      from: r.users.id,
      to: r.learningResources.uploadedByUserId,
    }),
    reviewedSuggestions: r.many.suggestions({
      from: r.users.id,
      to: r.suggestions.reviewedByUserId,
    }),
  },
});

const permissionRelations = (r: RelationsBuilderForSchema) => ({
  permissions: {
    groupPermissions: r.many.groupPermissions({
      from: r.permissions.id,
      to: r.groupPermissions.permissionId,
    }),
    permissionGroups: r.many.permissionGroups({
      from: r.permissions.id.through(r.groupPermissions.permissionId),
      to: r.permissionGroups.id.through(r.groupPermissions.groupId),
    }),
  },
  permissionGroups: {
    groupPermissions: r.many.groupPermissions({
      from: r.permissionGroups.id,
      to: r.groupPermissions.groupId,
    }),
    permissions: r.many.permissions({
      from: r.permissionGroups.id.through(r.groupPermissions.groupId),
      to: r.permissions.id.through(r.groupPermissions.permissionId),
    }),
    userPermissionGroups: r.many.userPermissionGroups({
      from: r.permissionGroups.id,
      to: r.userPermissionGroups.groupId,
    }),
    users: r.many.users({
      from: r.permissionGroups.id.through(r.userPermissionGroups.groupId),
      to: r.users.id.through(r.userPermissionGroups.userId),
    }),
    createdBy: r.one.users({
      from: r.permissionGroups.createdByUserId,
      to: r.users.id,
    }),
  },
  groupPermissions: {
    permissionGroup: r.one.permissionGroups({
      from: r.groupPermissions.groupId,
      to: r.permissionGroups.id,
    }),
    permission: r.one.permissions({
      from: r.groupPermissions.permissionId,
      to: r.permissions.id,
    }),
  },
  userPermissionGroups: {
    user: r.one.users({
      from: r.userPermissionGroups.userId,
      to: r.users.id,
    }),
    permissionGroup: r.one.permissionGroups({
      from: r.userPermissionGroups.groupId,
      to: r.permissionGroups.id,
    }),
    assignedBy: r.one.users({
      from: r.userPermissionGroups.assignedByUserId,
      to: r.users.id,
    }),
  },
});

const sessionRelations = (r: RelationsBuilderForSchema) => ({
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  userPaymentMethods: {
    user: r.one.users({
      from: r.userPaymentMethods.userId,
      to: r.users.id,
    }),
    verifiedBy: r.one.users({
      from: r.userPaymentMethods.verifiedByUserId,
      to: r.users.id,
    }),
    payments: r.many.payments({
      from: r.userPaymentMethods.id,
      to: r.payments.userPaymentMethodId,
    }),
    teacherPayments: r.many.teacherPayments({
      from: r.userPaymentMethods.id,
      to: r.teacherPayments.userPaymentMethodId,
    }),
  },
});

export const authRelations = (r: RelationsBuilderForSchema) => ({
  ...userRelations(r),
  ...permissionRelations(r),
  ...sessionRelations(r),
});
