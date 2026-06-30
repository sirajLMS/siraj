import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teacher.types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { AccountStatusPothosObject, GenderPothosObject, PaymentMethodPothosObject } from "./enum.pothos";

const TeacherProfileResultRef = gqlSchemaBuilder.objectRef<TeacherProfileReturnType>("TeacherProfileResult");

export const TeacherProfileResultPothosObject = TeacherProfileResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true, authScopes: { superAdmin: true } }),
    nationalId: t.exposeString("nationalId", { nullable: true, authScopes: { superAdmin: true } }),
    dateOfBirth: t.exposeString("dateOfBirth", { nullable: true }),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    address: t.exposeString("address", { nullable: true, authScopes: { superAdmin: true } }),
    qualifications: t.exposeString("qualifications", { nullable: true }),
    skypeId: t.exposeString("skypeId", { nullable: true, authScopes: { superAdmin: true } }),
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
      nationalId: t.string({ required: false }),
      phone: t.string({ required: false }),
      dateOfBirth: t.string({ required: false }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      address: t.string({ required: false }),
      qualifications: t.string({ required: false }),
      skypeId: t.string({ required: false }),
      zoomLink: t.string({ required: false }),
      zoomUsername: t.string({ required: false }),
      zoomPassword: t.string({ required: false }),
      timezone: t.string({ required: false }),
      hourlyRate: t.string({ required: false }),
      rateCurrency: t.string({ required: false }),
      paymentMethod: t.field({ type: PaymentMethodPothosObject, required: false }),
    }),
  });
