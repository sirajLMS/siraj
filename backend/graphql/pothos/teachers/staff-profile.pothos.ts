import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  AccountStatusPothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  IanaTimezonePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teachers/teacher.types";

const TeacherProfileResultRef = gqlSchemaBuilder.objectRef<TeacherProfileReturnType>("TeacherProfileResult");

export const TeacherProfileResultPothosObject = TeacherProfileResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId", { authScopes: { loggedIn: true } }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", {
      nullable: true,
      authScopes: (_parent, _args, ctx) =>
        ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.PROFILE_CORE_CONTACT_VIEW_OTHER),
    }),
    nationalId: t.exposeString("nationalId", {
      nullable: true,
      authScopes: (_parent, _args, ctx) =>
        ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.PROFILE_TEACHER_IDENTITY_VIEW_OTHER),
    }),
    nationality: t.exposeString("nationality", { nullable: true }),
    countryCode: t.exposeString("countryCode", { nullable: true }),
    dateOfBirth: t.exposeString("dateOfBirth", { nullable: true }),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    address: t.exposeString("address", {
      nullable: true,
      authScopes: (_parent, _args, ctx) =>
        ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.PROFILE_TEACHER_IDENTITY_VIEW_OTHER),
    }),
    qualifications: t.exposeString("qualifications", { nullable: true }),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject }),
    hourlyRate: t.exposeString("hourlyRate", {
      nullable: true,
      authScopes: (_parent, _args, ctx) =>
        ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER),
    }),
    rateCurrency: t.expose("rateCurrency", {
      type: CurrencyCodePothosObject,
      nullable: true,
      authScopes: (_parent, _args, ctx) =>
        ctx.isSuperAdmin || ctx.permissions.includes(AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER),
    }),
    status: t.expose("status", { type: AccountStatusPothosObject }),
    updatedAt: t.exposeString("updatedAt"),
    totalClasses: t.exposeInt("totalClasses"),
    avgEngagementScore: t.exposeFloat("avgEngagementScore"),
    displayAmount: t.field({
      type: DisplayAmountPothosObject,
      nullable: true,
      resolve: parent => parent.displayAmount ?? null,
    }),
  }),
});

export const TeacherProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherProfileUpdateInputType>("TeacherProfileUpdateInput")
  .implement({
    fields: t => ({
      nationalId: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      nationality: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      countryCode: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      phone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
      dateOfBirth: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      address: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      qualifications: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      timezone: t.field({ type: IanaTimezonePothosObject, required: false }),
      hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
      status: t.field({ type: AccountStatusPothosObject, required: false }),
    }),
  });
