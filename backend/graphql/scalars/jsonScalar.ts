import { GraphQLScalarType, Kind, type ValueNode } from "graphql";

// Pothos custom scalar for JSON
export const JSONScalar = new GraphQLScalarType({
	name: "JSON",
	description: "A type representing arbitrary JSON values",
	serialize(value: unknown): unknown {
		return value; // Return as-is for JSON
	},
	parseValue(value: unknown): unknown {
		return value; // Accept any JSON value
	},
	parseLiteral(
		ast: ValueNode,
		variables?: Record<string, unknown> | null,
	): unknown {
		// Parse JSON literals from GraphQL queries
		switch (ast.kind) {
			case Kind.STRING:
			case Kind.BOOLEAN:
				return ast.value;
			case Kind.INT:
			case Kind.FLOAT:
				return parseFloat(ast.value);
			case Kind.OBJECT:
				return ast.fields.reduce<Record<string, unknown>>((acc, field) => {
					acc[field.name.value] = JSONScalar.parseLiteral(
						field.value,
						variables,
					);
					return acc;
				}, {});
			case Kind.LIST:
				return ast.values.map((v) => JSONScalar.parseLiteral(v, variables));
			case Kind.NULL:
				return null;
			default:
				return null;
		}
	},
});
