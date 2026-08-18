import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  AccountStatusPothosObject,
  CurrencyCodePothosObject,
  IanaTimezonePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { ParentProfileService, StudentManagementService } from "@/backend/services";
import type {
  AssociatedStudentResult,
  DeactivateParentResult,
  EditQuotaResult,
  ParentProfileResult,
  ReactivateParentResult,
} from "@/backend/types";

// ─── ParentProfile Object ───────────────────────────────────────────────────

const ParentProfileRef = gqlSchemaBuilder.objectRef<ParentProfileResult>("ParentProfile");

export const ParentProfilePothosObject = ParentProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId", { authScopes: { superAdmin: true } }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    lifecycleStatus: t.exposeString("lifecycleStatus"),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
    phone: t.exposeString("phone", { nullable: true }),
    nationality: t.exposeString("nationality", { nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    facebook: t.exposeString("facebook", { nullable: true }),
    whatsapp: t.exposeString("whatsapp", { nullable: true }),
    twitter: t.exposeString("twitter", { nullable: true }),
    invoiceType: t.exposeString("invoiceType", { nullable: true }),
    feeAmount: t.exposeString("feeAmount", { nullable: true }),
    currency: t.expose("currency", { type: CurrencyCodePothosObject, nullable: true }),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject }),
    displayAmount: t.expose("displayAmount", {
      type: DisplayAmountPothosObject,
      nullable: true,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── AssociatedStudent Object ────────────────────────────────────────────────

const AssociatedStudentRef = gqlSchemaBuilder.objectRef<AssociatedStudentResult>("AssociatedStudent");

export const AssociatedStudentPothosObject = AssociatedStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    teacherUserId: t.exposeString("teacherUserId", { nullable: true }),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    hoursPerWeek: t.exposeString("hoursPerWeek"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    language: t.exposeString("language", { nullable: true }),
    gender: t.exposeString("gender", { nullable: true }),
    version: t.exposeInt("version"),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── DeactivateParentResult Object ──────────────────────────────────────────

const DeactivateParentResultRef = gqlSchemaBuilder.objectRef<DeactivateParentResult>("DeactivateParentResult");

export const DeactivateParentResultPothosObject = DeactivateParentResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
  }),
});

const ReactivateParentResultRef = gqlSchemaBuilder.objectRef<ReactivateParentResult>("ReactivateParentResult");

export const ReactivateParentResultPothosObject = ReactivateParentResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
  }),
});

// ─── EditQuotaResult Object ──────────────────────────────────────────────────

const EditQuotaResultRef = gqlSchemaBuilder.objectRef<EditQuotaResult>("EditQuotaResult");

export const EditQuotaResultPothosObject = EditQuotaResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    version: t.exposeInt("version"),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("parentProfile", t =>
  t.field({
    type: ParentProfileRef,
    authScopes: { loggedIn: true },
    nullable: true,
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getProfile(ctx.user?.id ?? "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentAssociatedStudents", t =>
  t.field({
    type: [AssociatedStudentRef],
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getAssociatedStudents(ctx.user?.id ?? "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentById", t =>
  t.field({
    type: AssociatedStudentRef,
    authScopes: { loggedIn: true },
    nullable: true,
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      // Reusing AssociatedStudentRef but fetching a single one.
      // Need a student-specific service method or repository call.
      // AssociatedStudentResult is defined as { id, name, status, teacherName, ... }
      return ParentProfileService.getStudentById(ctx.user?.id ?? "", args.studentId, ctx.locale);
    },
  })
);

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("deactivateParent", t =>
  t.field({
    type: DeactivateParentResultRef,
    authScopes: { permission: AppPermission.PARENT_MANAGE_STATUS },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.deactivateAccount(ctx.user?.id ?? "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("reactivateParent", t =>
  t.field({
    type: ReactivateParentResultRef,
    authScopes: { permission: AppPermission.PARENT_MANAGE_STATUS },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.reactivateAccount(ctx.user?.id ?? "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateStudentQuota", t =>
  t.field({
    type: EditQuotaResultRef,
    authScopes: { permission: AppPermission.STUDENT_QUOTA_EDIT_EDIT_OTHER },
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      newClassesRemaining: t.arg.int({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return StudentManagementService.editQuota(
        ctx.user?.id ?? "",
        args.studentId,
        tErrors,
        args.newClassesRemaining,
        args.expectedVersion ?? undefined
      );
    },
  })
);
