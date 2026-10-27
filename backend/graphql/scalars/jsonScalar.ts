import { GraphQLScalarType, Kind, type ValueNode } from "graphql";

// Pothos custom scalar for JSON
export const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "A type representing arbitrary JSON values",
  serialize(value: unknown): unknown {
    return value;
  },
  parseValue(value: unknown): unknown {
    return value;
  },
  parseLiteral(ast: ValueNode): unknown {
    return parseJsonLiteral(ast);
  },
});

function parseJsonLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number.parseFloat(ast.value);
    case Kind.OBJECT:
      return ast.fields.reduce<Record<string, unknown>>((acc, field) => {
        acc[field.name.value] = parseJsonLiteral(field.value);
        return acc;
      }, {});
    case Kind.LIST:
      return ast.values.map(v => parseJsonLiteral(v));
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}
