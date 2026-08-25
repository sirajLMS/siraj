import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { TeacherSimple } from "@/backend/types";

export const TeacherSimpleObjectRef = gqlSchemaBuilder.objectRef<TeacherSimple>("TeacherSimple");

export const TeacherSimplePothosObject = TeacherSimpleObjectRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});
