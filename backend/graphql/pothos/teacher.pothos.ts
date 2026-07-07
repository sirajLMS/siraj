import type { TeacherSimple } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

const TeacherSimpleObjectRef = gqlSchemaBuilder.objectRef<TeacherSimple>("TeacherSimple");

export const TeacherSimplePothosObject = TeacherSimpleObjectRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
  }),
});
