import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PaymentMethodDefaultsPothosObject,
  UserPaymentMethodPothosObject,
} from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { UserMeetingConfigPothosObject } from "@/backend/graphql/pothos/meeting/meeting.pothos";
import {
  ParentAssignedStudentsResultPothosObject,
  ParentOwnProfilePothosObject,
} from "@/backend/graphql/pothos/parents/parent-portal.pothos";
import { ParentProfilePothosObject } from "@/backend/graphql/pothos/parents/parent-profile.pothos";
import {
  parentAdminBillingInputFields,
  profileContactInputFields,
  profileSocialInputFields,
  teacherSpecificInputFields,
} from "@/backend/graphql/pothos/profile/__shared__/profileFieldHelpers";
import {
  AccountStatusPothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  OverrideStatePothosObject,
  ProfileAudiencePothosEnum,
  ProfileScopePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { ManagerDirectoryRowPothosObject } from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import {
  TeacherProfileResultPothosObject,
  TeacherProfileUpdateInputPothosObject,
} from "@/backend/graphql/pothos/teachers/staff-profile.pothos";
import {
  TeacherAssignedStudentsResultPothosObject,
  TeacherOwnProfilePothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-portal.pothos";
import type {
  CoreUserProfileFields,
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  StaffAdminProfileUpdateInput,
  StaffOwnProfileUpdateInput,
  StaffPermissionGroupReturnType,
  StaffPermissionOverrideReturnType,
  TeacherOwnProfileUpdateInput,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";

export const StaffPermissionGroupRef =
  gqlSchemaBuilder.objectRef<StaffPermissionGroupReturnType>("StaffPermissionGroup");

export const StaffPermissionGroupPothosObject = StaffPermissionGroupRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
  }),
});

export const StaffPermissionOverrideRef =
  gqlSchemaBuilder.objectRef<StaffPermissionOverrideReturnType>("StaffPermissionOverride");

export const StaffPermissionOverridePothosObject = StaffPermissionOverrideRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    permissionId: t.exposeString("permissionId"),
    permissionKey: t.exposeString("permissionKey"),
    resource: t.exposeString("resource"),
    action: t.exposeString("action"),
    state: t.expose("state", { type: OverrideStatePothosObject }),
  }),
});

export const UnifiedProfileRef = gqlSchemaBuilder.objectRef<UnifiedProfileReturnType>("UnifiedProfile");

export const UnifiedProfilePothosObject = UnifiedProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    audience: t.expose("audience", { type: ProfileAudiencePothosEnum }),
    scope: t.expose("scope", { type: ProfileScopePothosEnum }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    teacherId: t.exposeString("teacherId", { nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    staffProfileId: t.exposeString("staffProfileId", { nullable: true }),
    displayCurrency: t.expose("displayCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    timezone: t.expose("timezone", { type: "IanaTimezone", nullable: true }),
    phone: t.exposeString("phone", { nullable: true }),
    teacherOwnProfile: t.expose("teacherOwnProfile", { type: TeacherOwnProfilePothosObject, nullable: true }),
    teacherAdminProfile: t.expose("teacherAdminProfile", { type: TeacherProfileResultPothosObject, nullable: true }),
    parentOwnProfile: t.expose("parentOwnProfile", { type: ParentOwnProfilePothosObject, nullable: true }),
    parentAdminProfile: t.expose("parentAdminProfile", { type: ParentProfilePothosObject, nullable: true }),
    associatedStudents: t.expose("associatedStudents", {
      type: ParentAssignedStudentsResultPothosObject,
      nullable: true,
    }),
    staffProfile: t.expose("staffProfile", { type: ManagerDirectoryRowPothosObject, nullable: true }),
    staffPermissionGroups: t.expose("staffPermissionGroups", {
      type: [StaffPermissionGroupPothosObject],
      nullable: true,
    }),
    staffPermissionOverrides: t.expose("staffPermissionOverrides", {
      type: [StaffPermissionOverridePothosObject],
      nullable: true,
    }),
    meetingConfigs: t.expose("meetingConfigs", { type: [UserMeetingConfigPothosObject], nullable: true }),
    paymentMethods: t.expose("paymentMethods", { type: [UserPaymentMethodPothosObject], nullable: true }),
    paymentMethodDefaults: t.expose("paymentMethodDefaults", {
      type: PaymentMethodDefaultsPothosObject,
      nullable: true,
    }),
    assignedStudents: t.expose("assignedStudents", { type: TeacherAssignedStudentsResultPothosObject, nullable: true }),
  }),
});

export const CoreUserProfileFieldsInputPothosObject = gqlSchemaBuilder
  .inputRef<CoreUserProfileFields>("CoreUserProfileFieldsInput")
  .implement({
    fields: t => ({
      name: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      email: t.string({ required: false, directives: { constraint: { maxLength: 320 } } }),
      avatarUrl: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
      displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
      timezone: t.field({ type: "IanaTimezone", required: false }),
      status: t.field({
        type: AccountStatusPothosObject,
        required: false,
        description: "User account status (super admin only)",
      }),
    }),
  });

export const TeacherOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherOwnProfileUpdateInput>("TeacherOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      ...profileContactInputFields(t),
      ...teacherSpecificInputFields(t),
      gender: t.field({ type: GenderPothosObject, required: false }),
    }),
  });

export const ParentOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentOwnProfileUpdateInput>("ParentOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      ...profileContactInputFields(t),
      ...profileSocialInputFields(t),
    }),
  });

export const ParentAdminProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentAdminProfileUpdateInput>("ParentAdminProfileUpdateInput")
  .implement({
    fields: t => ({
      ...profileContactInputFields(t),
      ...profileSocialInputFields(t),
      ...parentAdminBillingInputFields(t),
      currency: t.field({ type: CurrencyCodePothosObject, required: false }),
    }),
  });

export const StaffOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<StaffOwnProfileUpdateInput>("StaffOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    }),
  });

export const StaffAdminProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<StaffAdminProfileUpdateInput>("StaffAdminProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
      status: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    }),
  });

export const UpdateOwnProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateOwnProfileInput>("UpdateOwnProfileInput")
  .implement({
    fields: t => ({
      core: t.field({ type: CoreUserProfileFieldsInputPothosObject, required: false }),
      teacher: t.field({ type: TeacherOwnProfileUpdateInputPothosObject, required: false }),
      parent: t.field({ type: ParentOwnProfileUpdateInputPothosObject, required: false }),
      staff: t.field({ type: StaffOwnProfileUpdateInputPothosObject, required: false }),
    }),
  });

export const UpdateUserProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateUserProfileInput>("UpdateUserProfileInput")
  .implement({
    fields: t => ({
      core: t.field({ type: CoreUserProfileFieldsInputPothosObject, required: false }),
      teacher: t.field({ type: TeacherProfileUpdateInputPothosObject, required: false }),
      parent: t.field({ type: ParentAdminProfileUpdateInputPothosObject, required: false }),
      staff: t.field({ type: StaffAdminProfileUpdateInputPothosObject, required: false }),
    }),
  });
