import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teacher.types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { AccountStatusPothosObject, GenderPothosObject, PaymentMethodPothosObject } from "./enum.pothos";

const TeacherProfileResultRef = gqlSchemaBuilder.objectRef<TeacherProfileReturnType>("TeacherProfileResult");

export const TeacherProfileResultPothosObject = TeacherProfileResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId", { authScopes: { superAdmin: true } }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true, authScopes: { superAdmin: true } }),
    nationalId: t.exposeString("nationalId", { nullable: true, authScopes: { superAdmin: true } }),
    dateOfBirth: t.exposeString("dateOfBirth", { nullable: true }),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    address: t.exposeString("address", { nullable: true, authScopes: { superAdmin: true } }),
    qualifications: t.exposeString("qualifications", { nullable: true }),
    zoomLink: t.exposeString("zoomLink", { nullable: true }),
    zoomUsername: t.exposeString("zoomUsername", { nullable: true }),
    timezone: t.exposeString("timezone"),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true, authScopes: { superAdmin: true } }),
    rateCurrency: t.exposeString("rateCurrency", { nullable: true, authScopes: { superAdmin: true } }),
    status: t.expose("status", { type: AccountStatusPothosObject }),
    updatedAt: t.exposeString("updatedAt"),
    paymentMethod: t.expose("paymentMethod", {
      type: PaymentMethodPothosObject,
      nullable: true,
      authScopes: { superAdmin: true },
    }),
    totalClasses: t.exposeInt("totalClasses"),
    avgEngagementScore: t.exposeFloat("avgEngagementScore"),
  }),
});

export const TeacherProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherProfileUpdateInputType>("TeacherProfileUpdateInput")
  .implement({
    fields: t => ({
      nationalId: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      phone: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      dateOfBirth: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      address: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      qualifications: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      zoomLink: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      zoomUsername: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      zoomPassword: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      timezone: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      rateCurrency: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      paymentMethod: t.field({ type: PaymentMethodPothosObject, required: false }),
      status: t.field({ type: AccountStatusPothosObject, required: false }),
    }),
  });
