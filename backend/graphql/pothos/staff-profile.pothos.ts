import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type TeacherProfileResultDefinition = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  qualifications: string | null;
  skypeId: string | null;
  zoomLink: string | null;
  zoomUsername: string | null;
  timezone: string;
  hourlyRate: string | null;
  rateCurrency: string | null;
  status: string;
};

const TeacherProfileResultRef = gqlSchemaBuilder.objectRef<TeacherProfileResultDefinition>("TeacherProfileResult");

export const TeacherProfileResultPothosObject = TeacherProfileResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true }),
    nationalId: t.exposeString("nationalId", { nullable: true }),
    dateOfBirth: t.exposeString("dateOfBirth", { nullable: true }),
    gender: t.exposeString("gender", { nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    qualifications: t.exposeString("qualifications", { nullable: true }),
    skypeId: t.exposeString("skypeId", { nullable: true }),
    zoomLink: t.exposeString("zoomLink", { nullable: true }),
    zoomUsername: t.exposeString("zoomUsername", { nullable: true }),
    timezone: t.exposeString("timezone"),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true }),
    rateCurrency: t.exposeString("rateCurrency", { nullable: true }),
    status: t.exposeString("status"),
  }),
});

export type TeacherProfileUpdateInputDefinition = {
  nationalId?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  qualifications?: string | null;
  skypeId?: string | null;
  zoomLink?: string | null;
  zoomUsername?: string | null;
  zoomPassword?: string | null;
  timezone?: string | null;
  hourlyRate?: string | null;
  rateCurrency?: string | null;
};

export const TeacherProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherProfileUpdateInputDefinition>("TeacherProfileUpdateInput")
  .implement({
    fields: t => ({
      nationalId: t.string({ required: false }),
      phone: t.string({ required: false }),
      dateOfBirth: t.string({ required: false }),
      gender: t.string({ required: false }),
      address: t.string({ required: false }),
      qualifications: t.string({ required: false }),
      skypeId: t.string({ required: false }),
      zoomLink: t.string({ required: false }),
      zoomUsername: t.string({ required: false }),
      zoomPassword: t.string({ required: false }),
      timezone: t.string({ required: false }),
      hourlyRate: t.string({ required: false }),
      rateCurrency: t.string({ required: false }),
    }),
  });
