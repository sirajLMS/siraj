import "@/backend/graphql/pothos";
import "@/backend/graphql/query";
import "@/backend/graphql/mutation";
import "@/backend/graphql/pothos/schema.types";

import { extendSchema, parse } from "graphql";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EmailScalar } from "@/backend/graphql/scalars/emailScalar";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import { LocalizedStringScalar } from "@/backend/graphql/scalars/localizedStringScalar";
import { PhoneNumberScalar } from "@/backend/graphql/scalars/phoneNumberScalar";
import { StringMapScalar } from "@/backend/graphql/scalars/stringMapScalar";

// Inlined @constraint directive SDL to avoid importing the full
// graphql-constraint-directive package here (which conditionally requires
// apollo-server-errors at runtime and breaks Turbopack resolution).
// The Apollo 4 validation plugin is imported separately in route.ts.
const constraintDirectiveTypeDefs = `
  directive @constraint(
    minLength: Int
    maxLength: Int
    startsWith: String
    endsWith: String
    contains: String
    notContains: String
    pattern: String
    format: String
    min: Float
    max: Float
    exclusiveMin: Float
    exclusiveMax: Float
    multipleOf: Float
    minItems: Int
    maxItems: Int
    uniqueTypeName: String
  ) on INPUT_FIELD_DEFINITION | FIELD_DEFINITION | ARGUMENT_DEFINITION
`;

gqlSchemaBuilder.addScalarType("Date", DateResolver, {});
gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
gqlSchemaBuilder.addScalarType("PhoneNumber", PhoneNumberScalar);
gqlSchemaBuilder.addScalarType("Email", EmailScalar);
gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
gqlSchemaBuilder.addScalarType("StringMap", StringMapScalar);
gqlSchemaBuilder.addScalarType("LocalizedString", LocalizedStringScalar);

gqlSchemaBuilder.mutationType({});

gqlSchemaBuilder.queryType({});

const baseSchema = gqlSchemaBuilder.toSchema();

// Register the @constraint directive definition in the schema so that
// the Apollo 4 validation plugin can recognize and enforce it at query time.
// We use extendSchema (not constraintDirective() transformer) to avoid
// replacing all scalar types with wrapping validators, which can break
// custom scalars and complex input types.
export const graphQLSchema = extendSchema(baseSchema, parse(constraintDirectiveTypeDefs));
