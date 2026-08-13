import { type ConstValueNode, GraphQLScalarType, Kind } from "graphql";
import type { ConstObjectFieldNode } from "graphql/language";

// Pothos custom scalar for JSON
export const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "A type representing arbitrary JSON values",
  coerceOutputValue(value: unknown): unknown {
    return value;
  },
  coerceInputValue(value: unknown): unknown {
    return value;
  },
  coerceInputLiteral(ast: ConstValueNode): unknown {
    return parseJsonLiteral(ast);
  },
  valueToLiteral(value: unknown): ConstValueNode | undefined {
    return jsonToLiteral(value);
  },
});

function parseJsonLiteral(ast: ConstValueNode): unknown {
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

function jsonToLiteral(value: unknown): ConstValueNode | undefined {
  if (value === null) {
    return { kind: Kind.NULL };
  }
  if (typeof value === "boolean") {
    return { kind: Kind.BOOLEAN, value };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { kind: Kind.INT, value: String(value) }
      : { kind: Kind.FLOAT, value: String(value) };
  }
  if (typeof value === "string") {
    return { kind: Kind.STRING, value };
  }
  if (Array.isArray(value)) {
    return {
      kind: Kind.LIST,
      values: value.map(v => jsonToLiteral(v)).filter((v): v is ConstValueNode => v !== undefined),
    };
  }
  if (typeof value === "object") {
    const fields = Object.entries(value)
      .map(([key, val]): ConstObjectFieldNode | null => {
        const literal = jsonToLiteral(val);
        if (!literal) return null;
        return { kind: Kind.OBJECT_FIELD, name: { kind: Kind.NAME, value: key }, value: literal };
      })
      .filter((f): f is ConstObjectFieldNode => f !== null);
    return { kind: Kind.OBJECT, fields };
  }
  return undefined;
}
