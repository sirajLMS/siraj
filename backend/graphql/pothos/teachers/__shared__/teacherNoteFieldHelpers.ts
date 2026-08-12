import type { InputFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosInputFieldBuilder = InputFieldBuilder<BuilderTypes, "InputObject">;

/**
 * Shared input field definitions for TeacherNote create/update inputs.
 * @param fieldBuilder - Pothos input field builder
 * @param titleRequired - Whether `title` is required (true for Create, false for Update)
 */
export function teacherNoteInputFields(fieldBuilder: PothosInputFieldBuilder, titleRequired: boolean) {
  return {
    title: fieldBuilder.string({ required: titleRequired, directives: { constraint: { maxLength: 255 } } }),
    body: fieldBuilder.string({ required: false, directives: { constraint: { maxLength: 10000 } } }),
    isPublished: fieldBuilder.boolean({ required: false }),
    priority: fieldBuilder.int({ required: false }),
    startsAt: fieldBuilder.field({ type: "DateTime", required: false }),
    expiresAt: fieldBuilder.field({ type: "DateTime", required: false }),
  };
}
