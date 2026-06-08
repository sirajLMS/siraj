import "./query";
import "./mutation";
import "./pothos/schema.types";

import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { gqlSchemaBuilder } from "./gqlSchemaBuilder";
import { EmailScalar } from "./scalars/emailScalar";
import { JSONScalar } from "./scalars/jsonScalar";
import { PhoneNumberScalar } from "./scalars/phoneNumberScalar";
import { StringMapScalar } from "./scalars/stringMapScalar";

gqlSchemaBuilder.addScalarType("Date", DateResolver, {});
gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
gqlSchemaBuilder.addScalarType("PhoneNumber", PhoneNumberScalar);
gqlSchemaBuilder.addScalarType("Email", EmailScalar);
gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
gqlSchemaBuilder.addScalarType("StringMap", StringMapScalar);

gqlSchemaBuilder.mutationType({});

gqlSchemaBuilder.queryType({});

export const graphQLSchema = gqlSchemaBuilder.toSchema();
