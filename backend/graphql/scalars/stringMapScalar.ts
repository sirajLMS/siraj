import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";

/**
 * StringMap scalar for Record<string, string>
 * Validates that all keys and values are strings
 */
export const StringMapScalar = new GraphQLScalarType({
	name: "StringMap",
	description: "A map of string keys to string values (Record<string, string>)",

	serialize(value: unknown): Record<string, string> {
		// Validate output
		if (typeof value !== "object" || value === null || Array.isArray(value)) {
			throw new GraphQLError("StringMap must be an object");
		}

		const obj = value as Record<string, unknown>;

		// Validate all values are strings
		for (const [key, val] of Object.entries(obj)) {
			if (typeof val !== "string") {
				throw new GraphQLError(
					`StringMap values must be strings. Key "${key}" has value of type ${typeof val}`,
				);
			}
		}

		return obj as Record<string, string>;
	},

	parseValue(value: unknown): Record<string, string> {
		// Validate input from variables
		if (typeof value !== "object" || value === null || Array.isArray(value)) {
			throw new GraphQLError("StringMap must be an object");
		}

		const obj = value as Record<string, unknown>;

		// Validate all values are strings
		for (const [key, val] of Object.entries(obj)) {
			if (typeof val !== "string") {
				throw new GraphQLError(
					`StringMap values must be strings. Key "${key}" has value of type ${typeof val}`,
				);
			}
		}

		return obj as Record<string, string>;
	},

	parseLiteral(ast: ValueNode): Record<string, string> {
		// Parse inline object literals from queries
		if (ast.kind !== Kind.OBJECT) {
			throw new GraphQLError("StringMap must be an object");
		}

		const result: Record<string, string> = {};

		for (const field of ast.fields) {
			const key = field.name.value;

			if (field.value.kind !== Kind.STRING) {
				throw new GraphQLError(
					`StringMap values must be strings. Key "${key}" has non-string value`,
				);
			}

			result[key] = field.value.value;
		}

		return result;
	},
});
