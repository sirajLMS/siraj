import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type TeacherSimpleDefinition = {
  id: string;
  name: string;
};

const TeacherSimpleObjectRef = gqlSchemaBuilder.objectRef<TeacherSimpleDefinition>("TeacherSimple");

export const TeacherSimplePothosObject = TeacherSimpleObjectRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
  }),
});
