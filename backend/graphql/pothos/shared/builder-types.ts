// Centralized Pothos builder type aliases (types-review R3).
// Eliminates the ~15 local re-declarations of BuilderTypes / PothosObjectFieldBuilder / etc.

import type { InputFieldBuilder, ObjectFieldBuilder, ObjectRef } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

// Extract the actual SchemaTypes from the builder instance.
type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;

// Generic object field builder parameterized by the parent shape.
export type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;

// Generic object ref parameterized by the parent shape.
export type PothosObjectRef<ParentShape> = ObjectRef<BuilderTypes, ParentShape>;

// Input field builder for input object definitions.
export type PothosInputFieldBuilder = InputFieldBuilder<BuilderTypes, "InputObject">;
